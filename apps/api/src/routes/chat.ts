import { Hono } from 'hono';
import { jwtAuth, getAuthUserId } from '../middleware/auth';
import { db } from '../config/database';
import { conversations, messages } from '../db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { generateId, now } from '@al/shared';
import { createError } from '../middleware/errorHandler';
import { ERROR_CODES, ERROR_MESSAGES, type ChatRequest, type ChatResponse, type Conversation, type Message, type APIResponse, type PaginatedResponse } from '@al/shared';
import { APP_CONFIG } from '../config/app';
import { callAI } from '../services/aiService';

const chatRouter = new Hono();

// Get all conversations for the authenticated user
chatRouter.get('/', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const { page = 1, pageSize = 20, sortBy = 'updatedAt', sortOrder = 'desc', search, projectId } = c.req.query();

    const limit = Math.min(parseInt(pageSize as string) || 20, 100);
    const offset = ((parseInt(page as string) || 1) - 1) * limit;

    // Build where clause
    const whereClause = [eq(conversations.userId, userId)];
    
    if (projectId) {
      whereClause.push(eq(conversations.projectId, projectId as string));
    }

    if (search) {
      whereClause.push(and(
        // Search in title
        // In SQLite, we can use LIKE for simple search
        // For more advanced search, we'd need FTS5
      ));
    }

    // Get conversations
    const [conversationsList, totalResult] = await Promise.all([
      db.query.conversations.findMany({
        where: and(...whereClause),
        orderBy: sortBy === 'updatedAt' ? desc(conversations.updatedAt) : asc(conversations.updatedAt),
        limit,
        offset,
      }),
      db.select({ count: conversations.id.count() }).from(conversations).where(and(...whereClause)),
    ]);

    const total = totalResult[0]?.count || 0;

    return c.json<APIResponse<PaginatedResponse<Conversation>>>({
      success: true,
      data: {
        data: conversationsList.map(conv => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
        })),
        total,
        page: parseInt(page as string) || 1,
        pageSize: limit,
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    throw err;
  }
});

// Create a new conversation
chatRouter.post('/', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const body = await c.req.json();

    const conversationId = generateId();
    const nowDate = now();

    // Create conversation
    await db.insert(conversations).values({
      id: conversationId,
      userId,
      title: body.title || 'Nowa konwersacja',
      projectId: body.projectId,
      model: body.model,
      provider: body.provider,
      isPinned: body.isPinned || false,
      isArchived: body.isArchived || false,
      sortOrder: body.sortOrder || 0,
      createdAt: nowDate,
      updatedAt: nowDate,
    });

    // Get the created conversation
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_QUERY_ERROR,
        ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
        500
      );
    }

    return c.json<APIResponse<Conversation>>({
      success: true,
      data: {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
      },
      message: 'Konwersacja została utworzona',
    });
  } catch (err) {
    throw err;
  }
});

// Get a specific conversation
chatRouter.get('/:id', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('id');

    // Get conversation
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Get messages
    const messagesList = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: asc(messages.createdAt),
    });

    return c.json<APIResponse<Conversation & { messages: Message[] }>>({
      success: true,
      data: {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
        messages: messagesList.map(msg => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt),
        })),
      },
    });
  } catch (err) {
    throw err;
  }
});

// Update a conversation
chatRouter.patch('/:id', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('id');
    const body = await c.req.json();

    // Check if conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Update conversation
    await db
      .update(conversations)
      .set({
        title: body.title,
        model: body.model,
        provider: body.provider,
        isPinned: body.isPinned,
        isArchived: body.isArchived,
        sortOrder: body.sortOrder,
        updatedAt: now(),
      })
      .where(eq(conversations.id, conversationId));

    // Get updated conversation
    const updatedConversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!updatedConversation) {
      throw createError(
        ERROR_CODES.DB_QUERY_ERROR,
        ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
        500
      );
    }

    return c.json<APIResponse<Conversation>>({
      success: true,
      data: {
        ...updatedConversation,
        createdAt: new Date(updatedConversation.createdAt),
        updatedAt: new Date(updatedConversation.updatedAt),
      },
      message: 'Konwersacja została zaktualizowana',
    });
  } catch (err) {
    throw err;
  }
});

// Delete a conversation
chatRouter.delete('/:id', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('id');

    // Check if conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Delete conversation (and all its messages due to cascade)
    await db.delete(conversations).where(eq(conversations.id, conversationId));

    return c.json<APIResponse<Conversation>>({
      success: true,
      data: {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
      },
      message: 'Konwersacja została usunięta',
    });
  } catch (err) {
    throw err;
  }
});

// Send a message (non-streaming)
chatRouter.post('/:conversationId/messages', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('conversationId');
    const body: ChatRequest = await c.req.json();

    // Check if conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Add user message
    const userMessageId = generateId();
    await db.insert(messages).values({
      id: userMessageId,
      conversationId,
      role: 'user',
      content: body.message,
      status: 'completed',
      createdAt: now(),
      updatedAt: now(),
    });

    // If not streaming, call AI directly
    if (!body.stream) {
      const aiResponse = await callAI({
        conversationId,
        message: body.message,
        model: body.model,
        provider: body.provider,
        userId,
        projectId: conversation.projectId,
      });

      // Add assistant message
      const assistantMessageId = generateId();
      await db.insert(messages).values({
        id: assistantMessageId,
        conversationId,
        role: 'assistant',
        content: aiResponse.message,
        status: 'completed',
        model: aiResponse.model,
        provider: aiResponse.provider,
        tokenUsage: aiResponse.tokenUsage,
        sources: aiResponse.sources,
        toolCalls: aiResponse.toolCalls,
        createdAt: now(),
        updatedAt: now(),
      });

      // Update conversation
      await db
        .update(conversations)
        .set({
          updatedAt: now(),
        })
        .where(eq(conversations.id, conversationId));

      // Get the assistant message
      const assistantMessage = await db.query.messages.findFirst({
        where: eq(messages.id, assistantMessageId),
      });

      if (!assistantMessage) {
        throw createError(
          ERROR_CODES.DB_QUERY_ERROR,
          ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
          500
        );
      }

      return c.json<APIResponse<ChatResponse>>({
        success: true,
        data: {
          id: assistantMessage.id,
          conversationId: assistantMessage.conversationId,
          message: assistantMessage.content,
          role: assistantMessage.role as 'assistant',
          status: assistantMessage.status as 'completed',
          model: assistantMessage.model,
          provider: assistantMessage.provider,
          tokenUsage: assistantMessage.tokenUsage as ChatResponse['tokenUsage'],
          sources: assistantMessage.sources as ChatResponse['sources'],
          toolCalls: assistantMessage.toolCalls as ChatResponse['toolCalls'],
          createdAt: new Date(assistantMessage.createdAt),
        },
      });
    }

    // For streaming, we'll handle it in a separate endpoint
    throw createError(
      ERROR_CODES.NOT_IMPLEMENTED,
      'Streaming nie jest obsługiwany w tym endpointcie',
      501
    );
  } catch (err) {
    throw err;
  }
});

// Send a message with streaming (SSE)
chatRouter.post('/:conversationId/messages/stream', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('conversationId');
    const body: ChatRequest = await c.req.json();

    // Check if conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Add user message
    const userMessageId = generateId();
    await db.insert(messages).values({
      id: userMessageId,
      conversationId,
      role: 'user',
      content: body.message,
      status: 'completed',
      createdAt: now(),
      updatedAt: now(),
    });

    // Update conversation
    await db
      .update(conversations)
      .set({
        updatedAt: now(),
      })
      .where(eq(conversations.id, conversationId));

    // For now, return a simple response
    // In a real implementation, we would use Server-Sent Events (SSE)
    // or WebSockets for streaming
    return c.json<APIResponse<{ streaming: boolean }>>({
      success: true,
      data: { streaming: true },
      message: 'Streaming będzie obsługiwany w przyszłych wersjach',
    });
  } catch (err) {
    throw err;
  }
});

// Regenerate message
chatRouter.post('/:conversationId/messages/:messageId/regenerate', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('conversationId');
    const messageId = c.req.param('messageId');

    // Check if conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Get the message to regenerate (should be the last user message before the assistant message)
    const message = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, messageId),
        eq(messages.conversationId, conversationId)
      ),
    });

    if (!message) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Find the previous user message
    const previousUserMessage = await db.query.messages.findFirst({
      where: and(
        eq(messages.conversationId, conversationId),
        eq(messages.role, 'user'),
        messages.createdAt < message.createdAt
      ),
      orderBy: desc(messages.createdAt),
    });

    if (!previousUserMessage) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Nie znaleziono poprzedniej wiadomości użytkownika',
        400
      );
    }

    // Call AI to regenerate
    const aiResponse = await callAI({
      conversationId,
      message: previousUserMessage.content,
      model: conversation.model,
      provider: conversation.provider,
      userId,
      projectId: conversation.projectId,
    });

    // Update the assistant message
    await db
      .update(messages)
      .set({
        content: aiResponse.message,
        status: 'completed',
        model: aiResponse.model,
        provider: aiResponse.provider,
        tokenUsage: aiResponse.tokenUsage,
        sources: aiResponse.sources,
        toolCalls: aiResponse.toolCalls,
        updatedAt: now(),
      })
      .where(eq(messages.id, messageId));

    // Get updated message
    const updatedMessage = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!updatedMessage) {
      throw createError(
        ERROR_CODES.DB_QUERY_ERROR,
        ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
        500
      );
    }

    return c.json<APIResponse<Message>>({
      success: true,
      data: {
        ...updatedMessage,
        createdAt: new Date(updatedMessage.createdAt),
        updatedAt: new Date(updatedMessage.updatedAt),
      },
      message: 'Wiadomość została wygenerowana ponownie',
    });
  } catch (err) {
    throw err;
  }
});

// Get messages for a conversation
chatRouter.get('/:conversationId/messages', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('conversationId');
    const { page = 1, pageSize = 50 } = c.req.query();

    const limit = Math.min(parseInt(pageSize as string) || 50, 100);
    const offset = ((parseInt(page as string) || 1) - 1) * limit;

    // Check if conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Get messages
    const [messagesList, totalResult] = await Promise.all([
      db.query.messages.findMany({
        where: eq(messages.conversationId, conversationId),
        orderBy: asc(messages.createdAt),
        limit,
        offset,
      }),
      db.select({ count: messages.id.count() }).from(messages).where(eq(messages.conversationId, conversationId)),
    ]);

    const total = totalResult[0]?.count || 0;

    return c.json<APIResponse<PaginatedResponse<Message>>>({
      success: true,
      data: {
        data: messagesList.map(msg => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt),
        })),
        total,
        page: parseInt(page as string) || 1,
        pageSize: limit,
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    throw err;
  }
});

// Update a message
chatRouter.patch('/:conversationId/messages/:messageId', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('conversationId');
    const messageId = c.req.param('messageId');
    const body = await c.req.json();

    // Check if conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Update message
    await db
      .update(messages)
      .set({
        content: body.content,
        updatedAt: now(),
      })
      .where(eq(messages.id, messageId));

    // Get updated message
    const updatedMessage = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!updatedMessage) {
      throw createError(
        ERROR_CODES.DB_QUERY_ERROR,
        ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
        500
      );
    }

    return c.json<APIResponse<Message>>({
      success: true,
      data: {
        ...updatedMessage,
        createdAt: new Date(updatedMessage.createdAt),
        updatedAt: new Date(updatedMessage.updatedAt),
      },
      message: 'Wiadomość została zaktualizowana',
    });
  } catch (err) {
    throw err;
  }
});

// Delete a message
chatRouter.delete('/:conversationId/messages/:messageId', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const conversationId = c.req.param('conversationId');
    const messageId = c.req.param('messageId');

    // Check if conversation exists
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw createError(
        ERROR_CODES.DB_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
        404
      );
    }

    // Delete message
    await db.delete(messages).where(eq(messages.id, messageId));

    return c.json<APIResponse<{ success: boolean }>>({
      success: true,
      data: { success: true },
      message: 'Wiadomość została usunięta',
    });
  } catch (err) {
    throw err;
  }
});

export default chatRouter;
