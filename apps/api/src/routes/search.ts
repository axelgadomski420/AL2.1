import { Hono } from 'hono';
import { jwtAuth, getAuthUserId } from '../middleware/auth';
import { db } from '../config/database';
import { conversations, messages, documents, memoryEntries, tasks } from '../db/schema';
import { eq, or, and, like } from 'drizzle-orm';
import { generateId, now } from '@al/shared';
import { createError } from '../middleware/errorHandler';
import { ERROR_CODES, ERROR_MESSAGES, type SearchRequest, type SearchResult, type APIResponse, type PaginatedResponse } from '@al/shared';
import { APP_CONFIG } from '../config/app';

const searchRouter = new Hono();

// Global search across all resources
searchRouter.post('/', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const body: SearchRequest = await c.req.json();

    const { query, type = 'all', projectId, limit = 20, offset = 0 } = body;

    if (!query || query.length < 2) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Zapytanie wyszukiwania musi mieć co najmniej 2 znaki',
        400
      );
    }

    const searchLimit = Math.min(limit, 50);
    const searchOffset = offset;

    // Build search queries based on type
    const searchQueries: Array<Promise<SearchResult[]>> = [];

    if (type === 'all' || type === 'messages') {
      searchQueries.push(
        db.query.messages.findMany({
          where: and(
            eq(messages.conversationId, conversations.id),
            eq(conversations.userId, userId),
            projectId ? eq(conversations.projectId, projectId) : undefined,
            or([
              like(messages.content, `%${query}%`),
            ])
          ),
          limit: searchLimit,
          offset: searchOffset,
        }).then(messages => messages.map(msg => ({
          type: 'message' as const,
          id: msg.id,
          title: msg.content.slice(0, 100),
          content: msg.content,
          relevance: 0.8, // Simple relevance score
          sourceType: 'message',
          sourceId: msg.conversationId,
          createdAt: new Date(msg.createdAt),
        }))
      );
    }

    if (type === 'all' || type === 'documents') {
      searchQueries.push(
        db.query.documents.findMany({
          where: and(
            eq(documents.userId, userId),
            projectId ? eq(documents.projectId, projectId) : undefined,
            or([
              like(documents.name, `%${query}%`),
              like(documents.originalName, `%${query}%`),
            ])
          ),
          limit: searchLimit,
          offset: searchOffset,
        }).then(docs => docs.map(doc => ({
          type: 'document' as const,
          id: doc.id,
          title: doc.name,
          content: doc.metadata?.description as string || '',
          relevance: 0.7,
          sourceType: 'document',
          sourceId: doc.id,
          url: doc.url,
          createdAt: new Date(doc.createdAt),
        })))
      );
    }

    if (type === 'all' || type === 'memory') {
      searchQueries.push(
        db.query.memoryEntries.findMany({
          where: and(
            eq(memoryEntries.userId, userId),
            projectId ? eq(memoryEntries.projectId, projectId) : undefined,
            or([
              like(memoryEntries.title, `%${query}%`),
              like(memoryEntries.content, `%${query}%`),
            ])
          ),
          limit: searchLimit,
          offset: searchOffset,
        }).then(entries => entries.map(entry => ({
          type: 'memory' as const,
          id: entry.id,
          title: entry.title,
          content: entry.content,
          relevance: 0.9,
          sourceType: entry.sourceType,
          sourceId: entry.sourceId,
          createdAt: new Date(entry.createdAt),
        })))
      );
    }

    if (type === 'all' || type === 'tasks') {
      searchQueries.push(
        db.query.tasks.findMany({
          where: and(
            eq(tasks.userId, userId),
            projectId ? eq(tasks.projectId, projectId) : undefined,
            or([
              like(tasks.title, `%${query}%`),
              like(tasks.description, `%${query}%`),
            ])
          ),
          limit: searchLimit,
          offset: searchOffset,
        }).then(tasks => tasks.map(task => ({
          type: 'task' as const,
          id: task.id,
          title: task.title,
          content: task.description || '',
          relevance: 0.6,
          sourceType: 'task',
          sourceId: task.id,
          createdAt: new Date(task.createdAt),
        })))
      );
    }

    // Execute all search queries
    const results = await Promise.all(searchQueries);

    // Flatten and sort results
    const allResults = results.flat();
    const sortedResults = allResults.sort((a, b) => b.relevance - a.relevance);

    return c.json<APIResponse<PaginatedResponse<SearchResult>>>({
      success: true,
      data: {
        data: sortedResults.slice(0, searchLimit),
        total: sortedResults.length,
        page: 1,
        pageSize: searchLimit,
        hasMore: searchOffset + searchLimit < sortedResults.length,
      },
    });
  } catch (err) {
    throw err;
  }
});

// Search in conversations only
searchRouter.post('/conversations', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const body: SearchRequest = await c.req.json();

    const { query, projectId, limit = 20, offset = 0 } = body;

    if (!query || query.length < 2) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Zapytanie wyszukiwania musi mieć co najmniej 2 znaki',
        400
      );
    }

    const searchLimit = Math.min(limit, 50);
    const searchOffset = offset;

    // Search in conversations
    const conversationsList = await db.query.conversations.findMany({
      where: and(
        eq(conversations.userId, userId),
        projectId ? eq(conversations.projectId, projectId) : undefined,
        or([
          like(conversations.title, `%${query}%`),
        ])
      ),
      limit: searchLimit,
      offset: searchOffset,
    });

    const results: SearchResult[] = conversationsList.map(conv => ({
      type: 'conversation' as const,
      id: conv.id,
      title: conv.title,
      content: '',
      relevance: 0.8,
      sourceType: 'conversation',
      sourceId: conv.id,
      createdAt: new Date(conv.createdAt),
    }));

    return c.json<APIResponse<PaginatedResponse<SearchResult>>>({
      success: true,
      data: {
        data: results,
        total: results.length,
        page: 1,
        pageSize: searchLimit,
        hasMore: searchOffset + searchLimit < results.length,
      },
    });
  } catch (err) {
    throw err;
  }
});

// Search in messages only
searchRouter.post('/messages', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const body: SearchRequest = await c.req.json();

    const { query, conversationId, projectId, limit = 20, offset = 0 } = body;

    if (!query || query.length < 2) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Zapytanie wyszukiwania musi mieć co najmniej 2 znaki',
        400
      );
    }

    const searchLimit = Math.min(limit, 50);
    const searchOffset = offset;

    // Search in messages
    const whereClause = [
      eq(conversations.userId, userId),
      or([
        like(messages.content, `%${query}%`),
      ]),
    ];

    if (conversationId) {
      whereClause.push(eq(messages.conversationId, conversationId));
    }

    if (projectId) {
      whereClause.push(eq(conversations.projectId, projectId));
    }

    const messagesList = await db.query.messages.findMany({
      where: and(...whereClause),
      limit: searchLimit,
      offset: searchOffset,
    });

    const results: SearchResult[] = messagesList.map(msg => ({
      type: 'message' as const,
      id: msg.id,
      title: msg.content.slice(0, 100),
      content: msg.content,
      relevance: 0.8,
      sourceType: 'message',
      sourceId: msg.conversationId,
      createdAt: new Date(msg.createdAt),
    }));

    return c.json<APIResponse<PaginatedResponse<SearchResult>>>({
      success: true,
      data: {
        data: results,
        total: results.length,
        page: 1,
        pageSize: searchLimit,
        hasMore: searchOffset + searchLimit < results.length,
      },
    });
  } catch (err) {
    throw err;
  }
});

// Quick search (for autocomplete)
searchRouter.get('/quick', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const query = c.req.query('q');

    if (!query || query.length < 2) {
      return c.json<APIResponse<SearchResult[]>>({
        success: true,
        data: [],
      });
    }

    // Limit to 10 results for quick search
    const limit = 10;

    // Search across all resource types
    const [conversationsList, messagesList, memoryList, tasksList] = await Promise.all([
      db.query.conversations.findMany({
        where: and(
          eq(conversations.userId, userId),
          or([
            like(conversations.title, `%${query}%`),
          ])
        ),
        limit,
      }),
      db.query.messages.findMany({
        where: and(
          eq(messages.conversationId, conversations.id),
          eq(conversations.userId, userId),
          or([
            like(messages.content, `%${query}%`),
          ])
        ),
        limit,
      }),
      db.query.memoryEntries.findMany({
        where: and(
          eq(memoryEntries.userId, userId),
          or([
            like(memoryEntries.title, `%${query}%`),
            like(memoryEntries.content, `%${query}%`),
          ])
        ),
        limit,
      }),
      db.query.tasks.findMany({
        where: and(
          eq(tasks.userId, userId),
          or([
            like(tasks.title, `%${query}%`),
            like(tasks.description, `%${query}%`),
          ])
        ),
        limit,
      }),
    ]);

    const results: SearchResult[] = [
      ...conversationsList.map(conv => ({
        type: 'conversation' as const,
        id: conv.id,
        title: conv.title,
        content: '',
        relevance: 0.8,
        sourceType: 'conversation',
        sourceId: conv.id,
        createdAt: new Date(conv.createdAt),
      })),
      ...messagesList.map(msg => ({
        type: 'message' as const,
        id: msg.id,
        title: msg.content.slice(0, 50),
        content: msg.content,
        relevance: 0.7,
        sourceType: 'message',
        sourceId: msg.conversationId,
        createdAt: new Date(msg.createdAt),
      })),
      ...memoryList.map(entry => ({
        type: 'memory' as const,
        id: entry.id,
        title: entry.title,
        content: entry.content,
        relevance: 0.9,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        createdAt: new Date(entry.createdAt),
      })),
      ...tasksList.map(task => ({
        type: 'task' as const,
        id: task.id,
        title: task.title,
        content: task.description || '',
        relevance: 0.6,
        sourceType: 'task',
        sourceId: task.id,
        createdAt: new Date(task.createdAt),
      })),
    ];

    // Sort by relevance and limit
    const sortedResults = results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return c.json<APIResponse<SearchResult[]>>({
      success: true,
      data: sortedResults,
    });
  } catch (err) {
    throw err;
  }
});

export default searchRouter;
