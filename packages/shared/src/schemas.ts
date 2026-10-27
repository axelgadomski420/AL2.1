import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  displayName: z.string().min(1),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  preferences: z.object({
    theme: z.enum(['dark', 'light', 'system']),
    language: z.string().default('pl'),
    voice: z.object({
      stt: z.string().optional(),
      tts: z.string().optional(),
    }).optional(),
    modelProfile: z.enum(['fast', 'quality', 'code', 'economy']).default('fast'),
    autoSave: z.boolean().default(true),
    notifications: z.boolean().default(true),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Project schemas
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isArchived: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  description: true,
  color: true,
  icon: true,
  isArchived: true,
  isPinned: true,
  sortOrder: true,
});

// Task schemas
export const TaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']),
  priority: z.enum([0, 1, 2, 3]).default(0),
  dueDate: z.date().optional(),
  reminderDate: z.date().optional(),
  sortOrder: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  projectId: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  reminderDate: true,
  sortOrder: true,
});

// Conversation schemas
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  model: z.string().optional(),
  provider: z.string().optional(),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateConversationSchema = ConversationSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  projectId: true,
  model: true,
  provider: true,
  isPinned: true,
  isArchived: true,
  sortOrder: true,
});

// Message schemas
export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  status: z.enum(['pending', 'streaming', 'completed', 'interrupted', 'failed']).optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  tokenUsage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
  sources: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['memory', 'document', 'web', 'tool']),
      title: z.string(),
      url: z.string().optional(),
      content: z.string().optional(),
      relevance: z.number().optional(),
    })
  ).optional(),
  toolCalls: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      arguments: z.record(z.unknown()),
      result: z.unknown().optional(),
      status: z.enum(['pending', 'completed', 'failed']),
      error: z.string().optional(),
      createdAt: z.date(),
      completedAt: z.date().optional(),
    })
  ).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMessageSchema = MessageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  status: true,
  model: true,
  provider: true,
  tokenUsage: true,
  sources: true,
  toolCalls: true,
  metadata: true,
});

// Memory schemas
export const MemoryEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['fact', 'preference', 'context', 'decision']),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  sourceType: z.enum(['conversation', 'document', 'manual']),
  sourceId: z.string(),
  projectId: z.string().uuid().optional(),
  scope: z.enum(['global', 'project']),
  status: z.enum(['active', 'archived', 'invalid']),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMemoryEntrySchema = MemoryEntrySchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  projectId: true,
  scope: true,
  status: true,
  confidence: true,
  tags: true,
  metadata: true,
});

// Document schemas
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  name: z.string().min(1),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  path: z.string(),
  url: z.string().optional(),
  status: z.enum(['uploading', 'processing', 'ready', 'error']),
  processingError: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UploadDocumentSchema = z.object({
  file: z.instanceof(File),
  projectId: z.string().uuid().optional(),
});

// AI Provider schemas
export const AIProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['mistral', 'groq', 'openrouter', 'custom']),
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  verificationDate: z.date().optional(),
  models: z.array(z.any()).default([]),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateAIProviderSchema = AIProviderSchema.omit({
  id: true,
  userId: true,
  isVerified: true,
  verificationDate: true,
  models: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  apiKey: true,
  isActive: true,
});

// Integration schemas
export const IntegrationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['github', 'cloudflare', 'notion', 'google', 'custom']),
  name: z.string().min(1),
  config: z.record(z.unknown()),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  isConnected: z.boolean().default(false),
  lastSync: z.date().optional(),
  syncError: z.string().optional(),
  permissions: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateIntegrationSchema = IntegrationSchema.omit({
  id: true,
  userId: true,
  accessToken: true,
  refreshToken: true,
  isConnected: true,
  lastSync: true,
  syncError: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  config: true,
});

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Hasła nie są identyczne",
  path: ["confirmPassword"],
});

// Chat schemas
export const ChatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1),
  stream: z.boolean().optional().default(false),
  model: z.string().optional(),
  provider: z.string().optional(),
  projectId: z.string().uuid().optional(),
});

// Voice schemas
export const STTRequestSchema = z.object({
  audio: z.instanceof(Blob),
  language: z.string().optional().default('pl'),
  model: z.string().optional(),
});

export const TTSRequestSchema = z.object({
  text: z.string().min(1),
  voice: z.string().optional(),
  language: z.string().optional().default('pl'),
  speed: z.number().min(0.5).max(2).optional().default(1),
  pitch: z.number().min(0.5).max(2).optional().default(1),
});

// Search schemas
export const SearchRequestSchema = z.object({
  query: z.string().min(1),
  type: z.enum(['all', 'messages', 'documents', 'memory', 'tasks']).optional().default('all'),
  projectId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// Tool schemas
export const ToolExecutionRequestSchema = z.object({
  name: z.string().min(1),
  arguments: z.record(z.unknown()),
  conversationId: z.string().uuid().optional(),
});

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});

// API Response schemas
export const APIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
      timestamp: z.date(),
    }).optional(),
    message: z.string().optional(),
  });

// Paginated response schema
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
  });

// Type guards
export const isAPIResponse = <T>(response: unknown, schema: z.ZodType<T>): response is APIResponse<T> => {
  try {
    const parsed = APIResponseSchema(schema).parse(response);
    return parsed.success !== undefined;
  } catch {
    return false;
  }
};

export const isErrorResponse = (response: unknown): response is { success: false; error: z.infer<typeof APIResponseSchema>['error'] } => {
  try {
    const parsed = APIResponseSchema(z.any()).parse(response);
    return parsed.success === false && parsed.error !== undefined;
  } catch {
    return false;
  }
};

// Validation utilities
export const validate = <T>(schema: z.ZodType<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Nieznany błąd walidacji' };
  }
};

export const validateAsync = async <T>(
  schema: z.ZodType<T>,
  data: unknown
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const parsed = await schema.parseAsync(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Nieznany błąd walidacji' };
  }
};
