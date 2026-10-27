import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
} from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationTokenExpires: integer('email_verification_token_expires', { mode: 'timestamp' }),
  passwordResetToken: text('password_reset_token'),
  passwordResetTokenExpires: integer('password_reset_token_expires', { mode: 'timestamp' }),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// User profiles table
export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  avatar: text('avatar'),
  preferences: blob('preferences', { mode: 'json' }).$type<{
    theme: 'dark' | 'light' | 'system';
    language: string;
    voice?: { stt: string; tts: string };
    modelProfile: 'fast' | 'quality' | 'code' | 'economy';
    autoSave: boolean;
    notifications: boolean;
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  icon: text('icon'),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().$type<'todo' | 'in_progress' | 'done' | 'archived'>(),
  priority: integer('priority').default(0).$type<0 | 1 | 2 | 3>(),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  reminderDate: integer('reminder_date', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Conversations table
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  model: text('model'),
  provider: text('provider'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Messages table
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull().$type<'user' | 'assistant' | 'system'>(),
  content: text('content').notNull(),
  status: text('status').$type<'pending' | 'streaming' | 'completed' | 'interrupted' | 'failed'>(),
  model: text('model'),
  provider: text('provider'),
  tokenUsage: blob('token_usage', { mode: 'json' }).$type<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }>(),
  sources: blob('sources', { mode: 'json' }).$type<Array<{
    id: string;
    type: 'memory' | 'document' | 'web' | 'tool';
    title: string;
    url?: string;
    content?: string;
    relevance?: number;
  }>>(),
  toolCalls: blob('tool_calls', { mode: 'json' }).$type<Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    status: 'pending' | 'completed' | 'failed';
    error?: string;
    createdAt: Date;
    completedAt?: Date;
  }>>(),
  metadata: blob('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Memory entries table
export const memoryEntries = sqliteTable('memory_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().$type<'fact' | 'preference' | 'context' | 'decision'>(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  sourceType: text('source_type').notNull().$type<'conversation' | 'document' | 'manual'>(),
  sourceId: text('source_id').notNull(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  scope: text('scope').notNull().$type<'global' | 'project'>(),
  status: text('status').notNull().$type<'active' | 'archived' | 'invalid'>(),
  confidence: real('confidence'),
  tags: blob('tags', { mode: 'json' }).$type<string[]>(),
  metadata: blob('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Documents table
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(),
  url: text('url'),
  status: text('status').notNull().$type<'uploading' | 'processing' | 'ready' | 'error'>(),
  processingError: text('processing_error'),
  metadata: blob('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// AI Providers table
export const aiProviders = sqliteTable('ai_providers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().$type<'mistral' | 'groq' | 'openrouter' | 'custom'>(),
  baseUrl: text('base_url').notNull(),
  encryptedApiKey: text('encrypted_api_key'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  verificationDate: integer('verification_date', { mode: 'timestamp' }),
  config: blob('config', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// AI Models table (cached from providers)
export const aiModels = sqliteTable('ai_models', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').references(() => aiProviders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  contextWindow: integer('context_window'),
  maxTokens: integer('max_tokens'),
  supportsStreaming: integer('supports_streaming', { mode: 'boolean' }).default(true),
  supportsTools: integer('supports_tools', { mode: 'boolean' }).default(false),
  isFree: integer('is_free', { mode: 'boolean' }).default(false),
  pricing: blob('pricing', { mode: 'json' }).$type<{ prompt?: number; completion?: number }>(),
  capabilities: blob('capabilities', { mode: 'json' }).$type<string[]>(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Integrations table
export const integrations = sqliteTable('integrations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().$type<'github' | 'cloudflare' | 'notion' | 'google' | 'custom'>(),
  name: text('name').notNull(),
  config: blob('config', { mode: 'json' }).$type<Record<string, unknown>>(),
  encryptedAccessToken: text('encrypted_access_token'),
  encryptedRefreshToken: text('encrypted_refresh_token'),
  isConnected: integer('is_connected', { mode: 'boolean' }).default(false),
  lastSync: integer('last_sync', { mode: 'timestamp' }),
  syncError: text('sync_error'),
  permissions: blob('permissions', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Reminders table
export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  triggerAt: integer('trigger_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().$type<'pending' | 'triggered' | 'completed' | 'cancelled'>(),
  repeat: blob('repeat', { mode: 'json' }).$type<{
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  }>(),
  notificationSent: integer('notification_sent', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Sessions table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Rate limiting table
export const rateLimits = sqliteTable('rate_limits', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(), // IP, user ID, or API key
  endpoint: text('endpoint').notNull(),
  count: integer('count').notNull().default(0),
  windowStart: integer('window_start', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Audit logs table
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  oldValue: blob('old_value', { mode: 'json' }),
  newValue: blob('new_value', { mode: 'json' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status').$type<'success' | 'failed'>(),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Search index table (for full-text search)
export const searchIndex = sqliteTable('search_index', {
  id: text('id').primaryKey(),
  resourceType: text('resource_type').notNull().$type<'message' | 'document' | 'memory' | 'task'>(),
  resourceId: text('resource_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  content: text('content').notNull(),
  tokens: blob('tokens', { mode: 'json' }).$type<number[]>(),
  metadata: blob('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Migration tracking table
export const migrations = sqliteTable('migrations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  executedAt: integer('executed_at', { mode: 'timestamp' }).notNull(),
});

// Export all tables for Drizzle migrations
export * as schema from './schema';
