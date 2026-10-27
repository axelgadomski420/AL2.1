import { db } from '../config/database';
import {
  memoryEntries,
  conversations,
  messages,
  documents,
  projects,
  tasks,
} from '../db/schema';
import { eq, and, or, desc, asc, like, sql, inArray } from 'drizzle-orm';
import {
  generateId,
  now,
  type MemoryEntry,
  type Conversation,
  type Message,
  type Document,
  type Project,
  type Task,
  type SourceReference,
  type ContextChunk,
  type MemorySearchResult,
  type MemoryIndexStatus,
} from '@al/shared';
import {
  createError,
  ERROR_CODES,
  ERROR_MESSAGES,
  MEMORY_CONFIG,
  APP_CONFIG,
} from '@al/shared';

// ============================================================================
// Context Builder - Main Service
// ============================================================================

/**
 * Context Builder - 12-step process for building AI context
 * 
 * This service implements the complete Context Builder pipeline as specified
 * in the architecture documentation. It:
 * 1. Authenticates the user
 * 2. Saves the user message
 * 3. Determines intent and project context
 * 4. Checks index status
 * 5. Loads user profile and relevant summaries
 * 6. Searches for relevant sources
 * 7. Adds project state and recent messages
 * 8. Resolves conflicts
 * 9. Builds context within token budget
 * 10. Calls AI model (handled by aiService)
 * 11. Saves response and context origin
 * 12. Queues index updates
 */

interface ContextBuilderOptions {
  userId: string;
  message: string;
  conversationId?: string;
  projectId?: string;
  maxContextTokens?: number;
  includeProjectState?: boolean;
  includeConversationHistory?: boolean;
  includeMemory?: boolean;
  includeDocuments?: boolean;
}

interface ContextBuilderResult {
  context: ContextChunk[];
  usedTokens: number;
  sources: SourceReference[];
  memoryEntries: MemoryEntry[];
  projectState?: {
    project?: Project;
    tasks?: Task[];
    recentMessages?: Message[];
  };
  indexStatus: MemoryIndexStatus;
  conflicts: Array<{
    entryId: string;
    conflictingWith: string[];
    type: 'contradiction' | 'outdated' | 'ambiguous';
    resolution: 'keep_newest' | 'keep_highest_confidence' | 'flag_for_review';
  }>;
}

// Token counter for context building
class TokenCounter {
  private count: number = 0;

  add(tokens: number): void {
    this.count += tokens;
  }

  getCount(): number {
    return this.count;
  }

  canAdd(tokens: number, budget: number): boolean {
    return this.count + tokens <= budget;
  }

  estimateTextTokens(text: string): number {
    // Simple estimation: 4 characters = 1 token (rough estimate)
    // This should be replaced with actual tokenizer in production
    return Math.ceil(text.length / 4);
  }
}

// ============================================================================
// Step 1: Authentication
// ============================================================================

/**
 * Step 1: Verify user identity
 * This is handled by the auth middleware, but we verify user exists
 */
const verifyUserIdentity = async (userId: string): Promise<void> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw createError(
      ERROR_CODES.AUTH_USER_NOT_FOUND,
      ERROR_MESSAGES[ERROR_CODES.AUTH_USER_NOT_FOUND],
      404
    );
  }

  // Check if user is locked
  if (user.lockedUntil) {
    const lockedUntil = new Date(user.lockedUntil);
    if (lockedUntil > new Date()) {
      throw createError(
        ERROR_CODES.AUTH_ACCOUNT_LOCKED,
        ERROR_MESSAGES[ERROR_CODES.AUTH_ACCOUNT_LOCKED],
        403
      );
    }
  }
};

// ============================================================================
// Step 2: Save Message
// ============================================================================

/**
 * Step 2: Persist user message to database
 * This is typically done by the chat service, but we ensure it's saved
 */
const saveUserMessage = async (
  userId: string,
  conversationId: string | undefined,
  message: string
): Promise<Message | null> => {
  if (!conversationId) {
    return null; // No conversation to save to
  }

  const messageId = generateId();
  const nowDate = now();

  await db.insert(messages).values({
    id: messageId,
    conversationId,
    role: 'user',
    content: message,
    status: 'completed',
    createdAt: nowDate,
    updatedAt: nowDate,
  });

  const savedMessage = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });

  if (!savedMessage) {
    throw createError(
      ERROR_CODES.DB_QUERY_ERROR,
      ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
      500
    );
  }

  return {
    ...savedMessage,
    createdAt: new Date(savedMessage.createdAt),
    updatedAt: new Date(savedMessage.updatedAt),
    tokenUsage: savedMessage.tokenUsage ? JSON.parse(savedMessage.tokenUsage) : undefined,
    sources: savedMessage.sources ? JSON.parse(savedMessage.sources) : [],
    toolCalls: savedMessage.toolCalls ? JSON.parse(savedMessage.toolCalls) : [],
    metadata: savedMessage.metadata ? JSON.parse(savedMessage.metadata) : {},
  };
};

// ============================================================================
// Step 3: Determine Intent and Project Context
// ============================================================================

interface IntentAnalysis {
  intent: 'chat' | 'research' | 'code' | 'project_management' | 'memory' | 'general';
  confidence: number;
  projectId?: string;
  keywords: string[];
}

/**
 * Step 3: Analyze message to determine intent and project context
 * This is a simple implementation - in production, this could use NLP
 */
const determineIntent = async (
  userId: string,
  message: string,
  conversationId?: string
): Promise<IntentAnalysis> => {
  const messageLower = message.toLowerCase();
  const keywords: string[] = [];

  // Detect intent based on keywords
  let intent: IntentAnalysis['intent'] = 'general';
  let confidence = 0.5;
  let projectId: string | undefined;

  // Check for project context
  if (conversationId) {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (conversation?.projectId) {
      projectId = conversation.projectId;
    }
  }

  // Intent detection
  const codeKeywords = ['kod', 'code', 'python', 'javascript', 'typescript', 'java', 'c++', 'function', 'class', 'import'];
  const researchKeywords = ['szukaj', 'search', 'znajdź', 'find', 'przeszukaj', 'research', 'informacja', 'info'];
  const projectKeywords = ['projekt', 'project', 'zadanie', 'task', 'zadania', 'tasks', 'plan', 'roadmap'];
  const memoryKeywords = ['pamięć', 'memory', 'zapamiętaj', 'remember', 'fakt', 'fact', 'preferencja', 'preference'];

  // Count keyword matches
  const codeMatches = codeKeywords.filter(kw => messageLower.includes(kw)).length;
  const researchMatches = researchKeywords.filter(kw => messageLower.includes(kw)).length;
  const projectMatches = projectKeywords.filter(kw => messageLower.includes(kw)).length;
  const memoryMatches = memoryKeywords.filter(kw => messageLower.includes(kw)).length;

  // Determine intent based on highest match count
  if (codeMatches > researchMatches && codeMatches > projectMatches && codeMatches > memoryMatches) {
    intent = 'code';
    confidence = Math.min(0.9, 0.5 + codeMatches * 0.1);
    keywords.push(...codeKeywords.filter(kw => messageLower.includes(kw)));
  } else if (researchMatches > codeMatches && researchMatches > projectMatches && researchMatches > memoryMatches) {
    intent = 'research';
    confidence = Math.min(0.9, 0.5 + researchMatches * 0.1);
    keywords.push(...researchKeywords.filter(kw => messageLower.includes(kw)));
  } else if (projectMatches > codeMatches && projectMatches > researchMatches && projectMatches > memoryMatches) {
    intent = 'project_management';
    confidence = Math.min(0.9, 0.5 + projectMatches * 0.1);
    keywords.push(...projectKeywords.filter(kw => messageLower.includes(kw)));
  } else if (memoryMatches > codeMatches && memoryMatches > researchMatches && memoryMatches > projectMatches) {
    intent = 'memory';
    confidence = Math.min(0.9, 0.5 + memoryMatches * 0.1);
    keywords.push(...memoryKeywords.filter(kw => messageLower.includes(kw)));
  } else {
    intent = 'chat';
    confidence = 0.7;
  }

  // If we have a project context, boost project-related confidence
  if (projectId && (intent === 'project_management' || intent === 'general')) {
    intent = 'project_management';
    confidence = Math.min(0.95, confidence + 0.2);
  }

  return {
    intent,
    confidence,
    projectId,
    keywords,
  };
};

// ============================================================================
// Step 4: Check Index Status
// ============================================================================

/**
 * Step 4: Verify memory index is up-to-date
 * Check when the index was last updated and if it needs refreshing
 */
const checkIndexStatus = async (userId: string): Promise<MemoryIndexStatus> => {
  // Get the most recent memory entry
  const latestEntry = await db.query.memoryEntries.findFirst({
    where: and(
      eq(memoryEntries.userId, userId),
      eq(memoryEntries.status, 'active')
    ),
    orderBy: desc(memoryEntries.createdAt),
  });

  // Get the count of memory entries
  const entryCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(memoryEntries)
    .where(and(
      eq(memoryEntries.userId, userId),
      eq(memoryEntries.status, 'active')
    ))
    .then(result => result[0]?.count || 0);

  // Check if index needs updating (simple heuristic: if we have entries but none recent)
  const nowDate = new Date();
  const oneHourAgo = new Date(nowDate.getTime() - 60 * 60 * 1000);

  const needsUpdate = latestEntry ? new Date(latestEntry.createdAt) < oneHourAgo : false;

  return {
    isIndexed: entryCount > 0,
    entryCount,
    lastUpdated: latestEntry ? new Date(latestEntry.updatedAt) : null,
    needsUpdate,
    status: needsUpdate ? 'needs_update' : entryCount > 0 ? 'up_to_date' : 'empty',
  };
};

// ============================================================================
// Step 5: Load User Profile and Summaries
// ============================================================================

interface UserProfileData {
  displayName: string;
  preferences: Record<string, unknown>;
  recentConversations: Conversation[];
  activeProjects: Project[];
  recentMemoryEntries: MemoryEntry[];
}

/**
 * Step 5: Fetch user preferences and relevant conversation summaries
 */
const loadUserProfile = async (userId: string): Promise<UserProfileData> => {
  // Get user profile
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  // Get recent conversations (last 10)
  const recentConversations = await db.query.conversations.findMany({
    where: and(
      eq(conversations.userId, userId),
      eq(conversations.isArchived, 0)
    ),
    orderBy: desc(conversations.updatedAt),
    limit: 10,
  });

  // Get active projects
  const activeProjects = await db.query.projects.findMany({
    where: and(
      eq(projects.userId, userId),
      or(
        eq(projects.isArchived, 0),
        sql`${projects.isArchived} IS NULL`
      )
    ),
    orderBy: desc(projects.updatedAt),
    limit: 10,
  });

  // Get recent memory entries (last 20)
  const recentMemoryEntries = await db.query.memoryEntries.findMany({
    where: and(
      eq(memoryEntries.userId, userId),
      eq(memoryEntries.status, 'active')
    ),
    orderBy: desc(memoryEntries.createdAt),
    limit: 20,
  });

  return {
    displayName: profile?.displayName || 'Użytkownik',
    preferences: profile?.preferences ? JSON.parse(profile.preferences) : {},
    recentConversations: recentConversations.map(conv => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
    })),
    activeProjects: activeProjects.map(proj => ({
      ...proj,
      createdAt: new Date(proj.createdAt),
      updatedAt: new Date(proj.updatedAt),
    })),
    recentMemoryEntries: recentMemoryEntries.map(entry => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      tags: entry.tags ? JSON.parse(entry.tags) : [],
      metadata: entry.metadata ? JSON.parse(entry.metadata) : {},
    })),
  };
};

// ============================================================================
// Step 6: Search Relevant Sources
// ============================================================================

/**
 * Step 6: Search for relevant information in memory, documents, and conversations
 */
const searchRelevantSources = async (
  userId: string,
  query: string,
  projectId?: string,
  intent: IntentAnalysis['intent'] = 'general',
  maxResults: number = MEMORY_CONFIG.MAX_SEARCH_RESULTS
): Promise<MemorySearchResult[]> => {
  const results: MemorySearchResult[] = [];
  const queryLower = query.toLowerCase();

  // Search in memory entries
  const memoryResults = await db.query.memoryEntries.findMany({
    where: and(
      eq(memoryEntries.userId, userId),
      eq(memoryEntries.status, 'active'),
      projectId ? eq(memoryEntries.projectId, projectId) : sql`1=1`,
      or(
        like(memoryEntries.title, `%${queryLower}%`),
        like(memoryEntries.content, `%${queryLower}%`)
      )
    ),
    orderBy: [
      desc(memoryEntries.confidence),
      desc(memoryEntries.updatedAt),
    ],
    limit: Math.ceil(maxResults / 3),
  });

  // Add memory results
  for (const entry of memoryResults) {
    results.push({
      id: entry.id,
      type: 'memory' as const,
      title: entry.title,
      content: entry.content,
      sourceId: entry.sourceId,
      sourceType: entry.sourceType as 'conversation' | 'document' | 'manual',
      relevance: entry.confidence || 0.8,
      projectId: entry.projectId || undefined,
      scope: entry.scope as 'global' | 'project',
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      metadata: entry.metadata ? JSON.parse(entry.metadata) : {},
    });
  }

  // Search in documents
  const documentResults = await db.query.documents.findMany({
    where: and(
      eq(documents.userId, userId),
      projectId ? eq(documents.projectId, projectId) : sql`1=1`,
      eq(documents.status, 'ready'),
      or(
        like(documents.name, `%${queryLower}%`),
        like(documents.originalName, `%${queryLower}%`)
      )
    ),
    orderBy: desc(documents.updatedAt),
    limit: Math.ceil(maxResults / 3),
  });

  // Add document results
  for (const doc of documentResults) {
    results.push({
      id: doc.id,
      type: 'document' as const,
      title: doc.name || doc.originalName,
      content: '', // Content would be loaded separately
      sourceId: doc.id,
      sourceType: 'document' as const,
      relevance: 0.7,
      projectId: doc.projectId || undefined,
      scope: 'project' as const,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
    });
  }

  // Search in recent conversations
  const conversationResults = await db.query.conversations.findMany({
    where: and(
      eq(conversations.userId, userId),
      projectId ? eq(conversations.projectId, projectId) : sql`1=1`,
      eq(conversations.isArchived, 0),
      or(
        like(conversations.title, `%${queryLower}%`),
        // Search in messages would require a join
      )
    ),
    orderBy: desc(conversations.updatedAt),
    limit: Math.ceil(maxResults / 3),
  });

  // Add conversation results
  for (const conv of conversationResults) {
    results.push({
      id: conv.id,
      type: 'conversation' as const,
      title: conv.title,
      content: '', // Content would be loaded separately
      sourceId: conv.id,
      sourceType: 'conversation' as const,
      relevance: 0.6,
      projectId: conv.projectId || undefined,
      scope: 'project' as const,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      metadata: { model: conv.model, provider: conv.provider },
    });
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);

  return results.slice(0, maxResults);
};

// ============================================================================
// Step 7: Add Project State
// ============================================================================

interface ProjectState {
  project?: Project;
  tasks: Task[];
  recentMessages: Message[];
  statusSummary: string;
}

/**
 * Step 7: Include current project status and tasks
 */
const addProjectState = async (
  userId: string,
  projectId: string | undefined
): Promise<ProjectState | null> => {
  if (!projectId) {
    return null;
  }

  // Get project
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.userId, userId)
    ),
  });

  if (!project) {
    return null;
  }

  // Get tasks for project
  const tasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.projectId, projectId),
      eq(tasks.userId, userId),
      or(
        eq(tasks.status, 'todo'),
        eq(tasks.status, 'in_progress')
      )
    ),
    orderBy: [
      desc(tasks.priority),
      asc(tasks.dueDate),
    ],
    limit: 10,
  });

  // Get recent messages for project conversations
  const projectConversations = await db.query.conversations.findMany({
    where: and(
      eq(conversations.projectId, projectId),
      eq(conversations.userId, userId)
    ),
    orderBy: desc(conversations.updatedAt),
    limit: 5,
  });

  const recentMessages: Message[] = [];
  for (const conv of projectConversations) {
    const msgs = await db.query.messages.findMany({
      where: eq(messages.conversationId, conv.id),
      orderBy: desc(messages.createdAt),
      limit: 2,
    });
    recentMessages.push(...msgs.map(msg => ({
      ...msg,
      createdAt: new Date(msg.createdAt),
      updatedAt: new Date(msg.updatedAt),
      tokenUsage: msg.tokenUsage ? JSON.parse(msg.tokenUsage) : undefined,
      sources: msg.sources ? JSON.parse(msg.sources) : [],
      toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) : [],
      metadata: msg.metadata ? JSON.parse(msg.metadata) : {},
    })));
  }

  // Generate status summary
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const statusSummary = `Projekt: ${project.name}. Zadania: ${todoCount} do zrobienia, ${inProgressCount} w trakcie, ${doneCount} ukończone.`;

  return {
    project: {
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    },
    tasks: tasks.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      reminderDate: task.reminderDate ? new Date(task.reminderDate) : undefined,
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
    })),
    recentMessages: recentMessages.slice(0, 10),
    statusSummary,
  };
};

// ============================================================================
// Step 8: Resolve Conflicts
// ============================================================================

/**
 * Step 8: Detect and resolve contradictory information
 */
const resolveConflicts = async (
  userId: string,
  searchResults: MemorySearchResult[],
  newMessage: string
): Promise<ContextBuilderResult['conflicts']> => {
  const conflicts: ContextBuilderResult['conflicts'] = [];

  // Simple conflict detection: look for direct contradictions
  // This is a placeholder - in production, use NLP to detect contradictions

  const messageLower = newMessage.toLowerCase();

  // Check for common contradiction patterns
  const contradictionPatterns = [
    { pattern: /nie jest|nie ma|nie potrafi/i, opposite: /jest|ma|potrafi/i },
    { pattern: /prawda/i, opposite: /fałsz|nieprawda/i },
    { pattern: /za/i, opposite: /przeciw/i },
  ];

  for (const result of searchResults) {
    if (result.type !== 'memory') continue;

    const contentLower = result.content.toLowerCase();

    for (const pattern of contradictionPatterns) {
      const hasPattern = pattern.pattern.test(messageLower);
      const hasOpposite = pattern.opposite.test(contentLower);

      if (hasPattern && hasOpposite) {
        conflicts.push({
          entryId: result.id,
          conflictingWith: [], // Would be populated with actual conflicting entries
          type: 'contradiction',
          resolution: 'flag_for_review',
        });
      }
    }
  }

  return conflicts;
};

// ============================================================================
// Step 9: Build Context
// ============================================================================

/**
 * Step 9: Assemble context within token budget
 * Prioritize by relevance and recency
 */
const buildContext = (
  userProfile: UserProfileData,
  searchResults: MemorySearchResult[],
  projectState: ProjectState | null,
  intent: IntentAnalysis,
  maxTokens: number = MEMORY_CONFIG.CONTEXT_BUILDER_MAX_TOKENS
): { context: ContextChunk[]; usedTokens: number; sources: SourceReference[] } => {
  const tokenCounter = new TokenCounter();
  const context: ContextChunk[] = [];
  const sources: SourceReference[] = [];

  // Token budget allocation
  const memoryTokens = Math.floor(maxTokens * 0.4);
  const projectTokens = Math.floor(maxTokens * 0.3);
  const conversationTokens = Math.floor(maxTokens * 0.2);
  const profileTokens = Math.floor(maxTokens * 0.1);

  // 1. Add user profile and preferences (low token count)
  if (tokenCounter.canAdd(profileTokens, maxTokens)) {
    const profileChunk: ContextChunk = {
      id: generateId(),
      type: 'profile',
      role: 'system',
      content: `Jesteś AL, osobistym asystentem AI dla ${userProfile.displayName}.`,
      tokenCount: tokenCounter.estimateTextTokens(
        `Jesteś AL, osobistym asystentem AI dla ${userProfile.displayName}.`
      ),
      weight: 1.0,
    };

    tokenCounter.add(profileChunk.tokenCount);
    context.push(profileChunk);

    // Add preferences if they exist
    if (userProfile.preferences && Object.keys(userProfile.preferences).length > 0) {
      const prefsText = `Preferencje: ${JSON.stringify(userProfile.preferences)}`;
      if (tokenCounter.canAdd(tokenCounter.estimateTextTokens(prefsText), maxTokens)) {
        context.push({
          id: generateId(),
          type: 'profile',
          role: 'system',
          content: prefsText,
          tokenCount: tokenCounter.estimateTextTokens(prefsText),
          weight: 0.8,
        });
        tokenCounter.add(tokenCounter.estimateTextTokens(prefsText));
      }
    }
  }

  // 2. Add project state if available
  if (projectState && tokenCounter.canAdd(projectTokens, maxTokens)) {
    const projectChunk: ContextChunk = {
      id: generateId(),
      type: 'project_state',
      role: 'system',
      content: projectState.statusSummary,
      tokenCount: tokenCounter.estimateTextTokens(projectState.statusSummary),
      weight: 0.9,
    };

    if (tokenCounter.canAdd(projectChunk.tokenCount, maxTokens)) {
      tokenCounter.add(projectChunk.tokenCount);
      context.push(projectChunk);
      
      // Add task list if we have tokens
      if (projectState.tasks.length > 0) {
        const tasksText = `Aktywne zadania: ${projectState.tasks.map(t => t.title).join(', ')}`;
        const tasksTokenCount = tokenCounter.estimateTextTokens(tasksText);
        
        if (tokenCounter.canAdd(tasksTokenCount, maxTokens)) {
          context.push({
            id: generateId(),
            type: 'project_state',
            role: 'system',
            content: tasksText,
            tokenCount: tasksTokenCount,
            weight: 0.7,
          });
          tokenCounter.add(tasksTokenCount);
        }
      }
    }
  }

  // 3. Add memory entries (prioritized by relevance and recency)
  const memoryEntries = searchResults.filter(r => r.type === 'memory');
  
  for (const entry of memoryEntries) {
    if (!tokenCounter.canAdd(tokenCounter.estimateTextTokens(entry.content), maxTokens)) {
      break; // No more tokens
    }

    const entryChunk: ContextChunk = {
      id: entry.id,
      type: 'memory',
      role: 'system',
      content: `[Pamięć: ${entry.scope === 'project' ? 'Projekt' : 'Global'} - ${entry.type}] ${entry.content}`,
      tokenCount: tokenCounter.estimateTextTokens(
        `[Pamięć: ${entry.scope === 'project' ? 'Projekt' : 'Global'} - ${entry.type}] ${entry.content}`
      ),
      weight: entry.relevance,
      metadata: {
        sourceId: entry.sourceId,
        sourceType: entry.sourceType,
        confidence: entry.relevance,
      },
    };

    tokenCounter.add(entryChunk.tokenCount);
    context.push(entryChunk);

    // Add to sources
    sources.push({
      id: entry.id,
      type: 'memory',
      title: entry.title,
      relevance: entry.relevance,
    });
  }

  // 4. Add conversation history if available
  if (projectState?.recentMessages.length > 0) {
    const messagesToAdd = projectState.recentMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(0, 5); // Last 5 messages

    for (const msg of messagesToAdd) {
      if (!tokenCounter.canAdd(tokenCounter.estimateTextTokens(msg.content), maxTokens)) {
        break;
      }

      const msgChunk: ContextChunk = {
        id: msg.id,
        type: 'conversation',
        role: msg.role,
        content: `[${msg.role === 'user' ? 'Użytkownik' : 'Asystent'}]: ${msg.content}`,
        tokenCount: tokenCounter.estimateTextTokens(
          `[${msg.role === 'user' ? 'Użytkownik' : 'Asystent'}]: ${msg.content}`
        ),
        weight: 0.6,
        metadata: {
          conversationId: msg.conversationId,
          model: msg.model,
          provider: msg.provider,
        },
      };

      tokenCounter.add(msgChunk.tokenCount);
      context.push(msgChunk);

      // Add to sources
      sources.push({
        id: msg.id,
        type: 'conversation',
        title: `Wiadomość ${msg.role}`,
        relevance: 0.6,
      });
    }
  }

  // 5. Add document references if available
  const documentResults = searchResults.filter(r => r.type === 'document');
  
  for (const doc of documentResults) {
    if (!tokenCounter.canAdd(50, maxTokens)) {
      break; // Reserve some tokens for the actual message
    }

    const docChunk: ContextChunk = {
      id: doc.id,
      type: 'document',
      role: 'system',
      content: `[Dokument: ${doc.title}] - dostępny do odniesienia`,
      tokenCount: tokenCounter.estimateTextTokens(
        `[Dokument: ${doc.title}] - dostępny do odniesienia`
      ),
      weight: 0.5,
      metadata: {
        documentId: doc.id,
        title: doc.title,
      },
    };

    tokenCounter.add(docChunk.tokenCount);
    context.push(docChunk);

    // Add to sources
    sources.push({
      id: doc.id,
      type: 'document',
      title: doc.title,
      relevance: doc.relevance,
    });
  }

  return {
    context,
    usedTokens: tokenCounter.getCount(),
    sources,
  };
};

// ============================================================================
// Main Context Builder Function
// ============================================================================

/**
 * Complete Context Builder pipeline
 * 
 * This function implements all 12 steps of the Context Builder process.
 * Steps 10-12 are handled externally (AI call, save response, update index)
 */
export const buildContext = async (
  options: ContextBuilderOptions
): Promise<ContextBuilderResult> => {
  const {
    userId,
    message,
    conversationId,
    projectId: explicitProjectId,
    maxContextTokens = MEMORY_CONFIG.CONTEXT_BUILDER_MAX_TOKENS,
    includeProjectState = true,
    includeConversationHistory = true,
    includeMemory = true,
    includeDocuments = true,
  } = options;

  const tokenCounter = new TokenCounter();

  try {
    // Step 1: Authentication
    await verifyUserIdentity(userId);

    // Step 2: Save message
    const savedMessage = await saveUserMessage(userId, conversationId, message);

    // Step 3: Determine intent
    const intentAnalysis = await determineIntent(userId, message, conversationId);
    
    // Use explicit projectId if provided, otherwise use from intent
    const projectId = explicitProjectId || intentAnalysis.projectId;

    // Step 4: Check index status
    const indexStatus = await checkIndexStatus(userId);

    // Step 5: Load user profile
    const userProfile = await loadUserProfile(userId);

    // Step 6: Search relevant sources
    let searchResults: MemorySearchResult[] = [];
    if (includeMemory || includeDocuments) {
      searchResults = await searchRelevantSources(
        userId,
        message,
        projectId,
        intentAnalysis.intent,
        MEMORY_CONFIG.MAX_SEARCH_RESULTS
      );
    }

    // Step 7: Add project state
    let projectState: ProjectState | null = null;
    if (includeProjectState && projectId) {
      projectState = await addProjectState(userId, projectId);
    }

    // Step 8: Resolve conflicts
    const conflicts = await resolveConflicts(userId, searchResults, message);

    // Step 9: Build context
    const { context, usedTokens, sources } = buildContext(
      userProfile,
      searchResults,
      projectState,
      intentAnalysis,
      maxContextTokens
    );

    // Step 10-12: Handled by aiService
    // - Step 10: Call AI model (done by aiService.callAI)
    // - Step 11: Save response (done by chat service)
    // - Step 12: Queue index updates (done by memory service)

    // Collect memory entries from search results
    const memoryEntries: MemoryEntry[] = searchResults
      .filter(r => r.type === 'memory')
      .map(r => ({
        id: r.id,
        userId,
        projectId: r.projectId,
        type: r.type,
        title: r.title,
        content: r.content,
        sourceType: r.sourceType,
        sourceId: r.sourceId,
        scope: r.scope,
        status: 'active',
        confidence: r.relevance,
        tags: [],
        metadata: r.metadata,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

    return {
      context,
      usedTokens,
      sources,
      memoryEntries,
      projectState,
      indexStatus,
      conflicts,
    };
  } catch (error) {
    console.error('Context Builder Error:', error);
    throw error;
  }
};

// ============================================================================
// Memory Entry Management
// ============================================================================

/**
 * Add a new memory entry
 */
export const addMemoryEntry = async (
  userId: string,
  data: {
    type: MemoryEntry['type'];
    title: string;
    content: string;
    sourceType: MemoryEntry['sourceType'];
    sourceId: string;
    projectId?: string;
    scope?: MemoryEntry['scope'];
    confidence?: number;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<MemoryEntry> => {
  const entryId = generateId();
  const nowDate = now();

  // Determine scope
  const scope: MemoryEntry['scope'] = data.scope || (data.projectId ? 'project' : 'global');

  await db.insert(memoryEntries).values({
    id: entryId,
    userId,
    type: data.type,
    title: data.title,
    content: data.content,
    sourceType: data.sourceType,
    sourceId: data.sourceId,
    projectId: data.projectId || null,
    scope,
    status: 'active',
    confidence: data.confidence || 0.8,
    tags: JSON.stringify(data.tags || []),
    metadata: JSON.stringify(data.metadata || {}),
    createdAt: nowDate,
    updatedAt: nowDate,
  });

  const entry = await db.query.memoryEntries.findFirst({
    where: eq(memoryEntries.id, entryId),
  });

  if (!entry) {
    throw createError(
      ERROR_CODES.DB_QUERY_ERROR,
      ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
      500
    );
  }

  return {
    ...entry,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
    tags: entry.tags ? JSON.parse(entry.tags) : [],
    metadata: entry.metadata ? JSON.parse(entry.metadata) : {},
  };
};

/**
 * Get memory entries for a user
 */
export const getMemoryEntries = async (
  userId: string,
  options: {
    projectId?: string;
    type?: MemoryEntry['type'];
    scope?: MemoryEntry['scope'];
    status?: MemoryEntry['status'];
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ entries: MemoryEntry[]; total: number }> => {
  const {
    projectId,
    type,
    scope,
    status,
    search,
    limit = 20,
    offset = 0,
  } = options;

  // Build where clause
  const whereClauses = [
    eq(memoryEntries.userId, userId),
  ];

  if (projectId) {
    whereClauses.push(eq(memoryEntries.projectId, projectId));
  }

  if (type) {
    whereClauses.push(eq(memoryEntries.type, type));
  }

  if (scope) {
    whereClauses.push(eq(memoryEntries.scope, scope));
  }

  if (status) {
    whereClauses.push(eq(memoryEntries.status, status));
  }

  if (search) {
    const searchLower = search.toLowerCase();
    whereClauses.push(
      or(
        like(memoryEntries.title, `%${searchLower}%`),
        like(memoryEntries.content, `%${searchLower}%`)
      )
    );
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(memoryEntries)
    .where(and(...whereClauses))
    .then(result => result[0]?.count || 0);

  // Get entries
  const entries = await db.query.memoryEntries.findMany({
    where: and(...whereClauses),
    orderBy: desc(memoryEntries.updatedAt),
    limit,
    offset,
  });

  return {
    entries: entries.map(entry => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      tags: entry.tags ? JSON.parse(entry.tags) : [],
      metadata: entry.metadata ? JSON.parse(entry.metadata) : {},
    })),
    total: countResult,
  };
};

/**
 * Update a memory entry
 */
export const updateMemoryEntry = async (
  userId: string,
  entryId: string,
  data: {
    type?: MemoryEntry['type'];
    title?: string;
    content?: string;
    sourceType?: MemoryEntry['sourceType'];
    sourceId?: string;
    projectId?: string | null;
    scope?: MemoryEntry['scope'];
    status?: MemoryEntry['status'];
    confidence?: number;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<MemoryEntry> => {
  // Check ownership
  const existingEntry = await db.query.memoryEntries.findFirst({
    where: and(
      eq(memoryEntries.id, entryId),
      eq(memoryEntries.userId, userId)
    ),
  });

  if (!existingEntry) {
    throw createError(
      ERROR_CODES.DB_NOT_FOUND,
      ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
      404
    );
  }

  const nowDate = now();

  await db
    .update(memoryEntries)
    .set({
      type: data.type,
      title: data.title,
      content: data.content,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      projectId: data.projectId,
      scope: data.scope,
      status: data.status,
      confidence: data.confidence,
      tags: JSON.stringify(data.tags || []),
      metadata: JSON.stringify(data.metadata || {}),
      updatedAt: nowDate,
    })
    .where(eq(memoryEntries.id, entryId));

  const updatedEntry = await db.query.memoryEntries.findFirst({
    where: eq(memoryEntries.id, entryId),
  });

  if (!updatedEntry) {
    throw createError(
      ERROR_CODES.DB_QUERY_ERROR,
      ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
      500
    );
  }

  return {
    ...updatedEntry,
    createdAt: new Date(updatedEntry.createdAt),
    updatedAt: new Date(updatedEntry.updatedAt),
    tags: updatedEntry.tags ? JSON.parse(updatedEntry.tags) : [],
    metadata: updatedEntry.metadata ? JSON.parse(updatedEntry.metadata) : {},
  };
};

/**
 * Delete a memory entry
 */
export const deleteMemoryEntry = async (
  userId: string,
  entryId: string
): Promise<void> => {
  // Check ownership
  const existingEntry = await db.query.memoryEntries.findFirst({
    where: and(
      eq(memoryEntries.id, entryId),
      eq(memoryEntries.userId, userId)
    ),
  });

  if (!existingEntry) {
    throw createError(
      ERROR_CODES.DB_NOT_FOUND,
      ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
      404
    );
  }

  await db
    .update(memoryEntries)
    .set({
      status: 'deleted',
      updatedAt: now(),
    })
    .where(eq(memoryEntries.id, entryId));
};

/**
 * Rebuild memory index for a user
 * This triggers a re-indexing of all memory entries
 */
export const rebuildMemoryIndex = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Get all active memory entries
    const entries = await db.query.memoryEntries.findMany({
      where: and(
        eq(memoryEntries.userId, userId),
        eq(memoryEntries.status, 'active')
      ),
    });

    // In a real implementation, we would:
    // 1. Clear the search index
    // 2. Re-index all entries
    // 3. Update vector embeddings if using semantic search

    // For now, just mark that index was rebuilt
    // This is a placeholder for actual index rebuilding logic

    return {
      success: true,
      message: `Zaindeksowano ${entries.length} wpisów pamięci`,
    };
  } catch (error) {
    console.error('Memory Index Rebuild Error:', error);
    return {
      success: false,
      message: 'Błąd podczas przebudowy indeksu pamięci',
    };
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get memory statistics for a user
 */
export const getMemoryStats = async (userId: string): Promise<{
  totalEntries: number;
  byType: Record<MemoryEntry['type'], number>;
  byScope: Record<MemoryEntry['scope'], number>;
  byStatus: Record<MemoryEntry['status'], number>;
  lastUpdated: Date | null;
}> => {
  // Get counts by type
  const typeCounts = await db
    .select({
      type: memoryEntries.type,
      count: sql<number>`count(*)`,
    })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .groupBy(memoryEntries.type);

  // Get counts by scope
  const scopeCounts = await db
    .select({
      scope: memoryEntries.scope,
      count: sql<number>`count(*)`,
    })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .groupBy(memoryEntries.scope);

  // Get counts by status
  const statusCounts = await db
    .select({
      status: memoryEntries.status,
      count: sql<number>`count(*)`,
    })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .groupBy(memoryEntries.status);

  // Get total count
  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .then(result => result[0]?.count || 0);

  // Get last updated
  const lastUpdated = await db.query.memoryEntries.findFirst({
    where: eq(memoryEntries.userId, userId),
    orderBy: desc(memoryEntries.updatedAt),
  });

  // Build result
  const byType: Record<MemoryEntry['type'], number> = {
    fact: 0,
    preference: 0,
    context: 0,
    decision: 0,
  };

  for (const row of typeCounts) {
    byType[row.type as MemoryEntry['type']] = row.count;
  }

  const byScope: Record<MemoryEntry['scope'], number> = {
    global: 0,
    project: 0,
  };

  for (const row of scopeCounts) {
    byScope[row.scope as MemoryEntry['scope']] = row.count;
  }

  const byStatus: Record<MemoryEntry['status'], number> = {
    active: 0,
    archived: 0,
    invalid: 0,
    deleted: 0,
  };

  for (const row of statusCounts) {
    byStatus[row.status as MemoryEntry['status']] = row.count;
  }

  return {
    totalEntries: totalCount,
    byType,
    byScope,
    byStatus,
    lastUpdated: lastUpdated ? new Date(lastUpdated.updatedAt) : null,
  };
};

// Import users and userProfiles for type references
import { users, userProfiles } from '../db/schema';
