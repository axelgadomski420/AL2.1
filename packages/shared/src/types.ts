// Core types shared between frontend and backend

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  language: string;
  voice?: {
    stt: string;
    tts: string;
  };
  modelProfile: 'fast' | 'quality' | 'code' | 'economy';
  autoSave: boolean;
  notifications: boolean;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isArchived: boolean;
  isPinned: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 0 | 1 | 2 | 3; // 0 = none, 1 = low, 2 = medium, 3 = high
  dueDate?: Date;
  reminderDate?: Date;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  model?: string;
  provider?: string;
  isPinned: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status?: 'pending' | 'streaming' | 'completed' | 'interrupted' | 'failed';
  model?: string;
  provider?: string;
  tokenUsage?: TokenUsage;
  sources?: SourceReference[];
  toolCalls?: ToolCall[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface SourceReference {
  id: string;
  type: 'memory' | 'document' | 'web' | 'tool';
  title: string;
  url?: string;
  content?: string;
  relevance?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface MemoryEntry {
  id: string;
  userId: string;
  type: 'fact' | 'preference' | 'context' | 'decision';
  title: string;
  content: string;
  sourceType: 'conversation' | 'document' | 'manual';
  sourceId: string;
  projectId?: string;
  scope: 'global' | 'project';
  status: 'active' | 'archived' | 'invalid';
  confidence?: number;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  projectId?: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  processingError?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProvider {
  id: string;
  name: string;
  type: 'mistral' | 'groq' | 'openrouter' | 'custom';
  baseUrl: string;
  apiKey?: string; // Encrypted at rest
  isActive: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  models: AIModel[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  displayName: string;
  contextWindow: number;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  isFree: boolean;
  pricing?: {
    prompt: number;
    completion: number;
  };
  capabilities: string[];
  isActive: boolean;
}

export interface Integration {
  id: string;
  userId: string;
  type: 'github' | 'cloudflare' | 'notion' | 'google' | 'custom';
  name: string;
  config: Record<string, unknown>;
  accessToken?: string; // Encrypted at rest
  refreshToken?: string; // Encrypted at rest
  isConnected: boolean;
  lastSync?: Date;
  syncError?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  taskId?: string;
  title: string;
  description?: string;
  triggerAt: Date;
  status: 'pending' | 'triggered' | 'completed' | 'cancelled';
  repeat?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  message?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SearchRequest {
  query: string;
  type?: 'all' | 'messages' | 'documents' | 'memory' | 'tasks';
  projectId?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  type: 'message' | 'document' | 'memory' | 'task';
  id: string;
  title: string;
  content: string;
  relevance: number;
  sourceType: string;
  sourceId: string;
  url?: string;
  createdAt: Date;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// Chat Types
export interface ChatRequest {
  conversationId?: string;
  message: string;
  stream?: boolean;
  model?: string;
  provider?: string;
  projectId?: string;
  freeFirst?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface ChatResponse {
  id: string;
  conversationId: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  status: 'pending' | 'streaming' | 'completed' | 'interrupted' | 'failed';
  model?: string;
  provider?: string;
  tokenUsage?: TokenUsage;
  sources?: SourceReference[];
  toolCalls?: ToolCall[];
  createdAt: Date;
}

// Voice Types
export interface STTRequest {
  audio: Blob;
  language?: string;
  model?: string;
}

export interface STTResponse {
  text: string;
  confidence?: number;
  language?: string;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
}

export interface TTSResponse {
  audio: Blob;
  mimeType: string;
}

// Context Builder Types
export interface ContextRequest {
  userId: string;
  conversationId?: string;
  message: string;
  projectId?: string;
  maxTokens: number;
}

export interface ContextResponse {
  systemPrompt: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  memoryContext: string;
  projectContext?: string;
  sources: SourceReference[];
  tools: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  tokenCount: number;
}

// Memory Service Types for Context Builder
export interface ContextChunk {
  id: string;
  type: 'profile' | 'memory' | 'project_state' | 'conversation' | 'document' | 'intent';
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokenCount: number;
  weight: number;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchResult {
  id: string;
  type: 'memory' | 'document' | 'conversation';
  title: string;
  content: string;
  sourceId: string;
  sourceType: 'conversation' | 'document' | 'manual';
  relevance: number;
  projectId?: string;
  scope: 'global' | 'project';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface MemoryIndexStatus {
  isIndexed: boolean;
  entryCount: number;
  lastUpdated: Date | null;
  needsUpdate: boolean;
  status: 'empty' | 'up_to_date' | 'needs_update';
}

// Tool Types
export interface ToolDefinition {
  name: string;
  description: string;
  schema: {
    type: string;
    properties: Record<string, {
      type: string;
      description?: string;
      required?: boolean;
    }>;
    required?: string[];
  };
  handler: (args: Record<string, unknown>) => Promise<unknown>;
  riskLevel: 'low' | 'medium' | 'high';
  requiredPermissions: string[];
  timeout?: number;
}

export interface ToolExecutionRequest {
  name: string;
  arguments: Record<string, unknown>;
  conversationId?: string;
}

export interface ToolExecutionResponse {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  tokenUsage?: TokenUsage;
  createdAt: Date;
  completedAt?: Date;
}

// Webhook Types
export interface WebhookEvent {
  type: 'conversation.created' | 'message.created' | 'task.updated' | 'reminder.triggered';
  data: Record<string, unknown>;
  timestamp: Date;
  userId: string;
}

// Encryption Types
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  version: number;
  timestamp: Date;
}

export interface KeyRotationConfig {
  currentVersion: number;
  previousVersions: number[];
  rotationInterval: number; // days
  lastRotation: Date;
}

// Rate Limiting Types
export interface RateLimitConfig {
  window: number; // in seconds
  maxRequests: number;
  by: 'ip' | 'user' | 'apiKey';
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  version: string;
  services: Record<string, {
    status: 'up' | 'down';
    latency?: number;
    lastCheck?: Date;
  }>;
}
