import { db } from '../config/database';
import { aiProviders, aiModels } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateId, now } from '@al/shared';
import { createError } from '../middleware/errorHandler';
import {
  ERROR_CODES,
  ERROR_MESSAGES,
  type AIProvider,
  type AIModel,
  type ChatResponse,
  type SourceReference,
  type TokenUsage,
  type ToolCall,
  type ChatRequest,
  type ChatStreamChunk,
} from '@al/shared';
import { APP_CONFIG, AI_PROVIDERS, MODEL_PROFILES, TOKEN_LIMITS, FREE_TIER_INFO } from '@al/shared';
import axios, { AxiosError } from 'axios';
import { buildContext, type ContextBuilderResult } from './memoryService';

interface AIRequest extends ChatRequest {
  userId: string;
  conversationId?: string;
  projectId?: string;
}

// Enhanced provider configuration with free tier info
interface AIProviderConfig {
  baseUrl: string;
  apiKey?: string;
  type: string;
  supportsStreaming: boolean;
  supportsTools: boolean;
  freeTier: {
    available: boolean;
    rateLimit: number; // requests per minute
    dailyLimit: number; // requests per day
    tokenLimit: number; // tokens per month (if applicable)
  };
}

interface AIProviderConfig {
  baseUrl: string;
  apiKey?: string;
  type: string;
  supportsStreaming: boolean;
  supportsTools: boolean;
}

// Cache for AI models
let modelsCache: Record<string, AIModel[]> = {};
let lastCacheUpdate: Date = new Date(0);
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Get AI provider configuration with free tier info
const getAIProvider = async (providerId: string, userId: string): Promise<AIProviderConfig> => {
  if (!providerId) {
    const defaultProviderType = APP_CONFIG.AI_DEFAULT_PROVIDER as keyof typeof AI_PROVIDERS;
    const defaultProvider = AI_PROVIDERS[defaultProviderType];
    return {
      baseUrl: defaultProvider.BASE_URL,
      type: defaultProvider.TYPE,
      supportsStreaming: defaultProvider.SUPPORTS_STREAMING,
      supportsTools: defaultProvider.SUPPORTS_TOOLS,
      freeTier: getFreeTierInfo(defaultProvider.TYPE),
    };
  }

  const builtInProvider = AI_PROVIDERS[providerId as keyof typeof AI_PROVIDERS];
  if (builtInProvider) {
    return {
      baseUrl: builtInProvider.BASE_URL,
      type: builtInProvider.TYPE,
      supportsStreaming: builtInProvider.SUPPORTS_STREAMING,
      supportsTools: builtInProvider.SUPPORTS_TOOLS,
      freeTier: getFreeTierInfo(builtInProvider.TYPE),
    };
  }

  const provider = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.id, providerId),
      eq(aiProviders.userId, userId)
    ),
  });

  if (!provider) {
    throw createError(
      ERROR_CODES.AI_PROVIDER_NOT_FOUND,
      ERROR_MESSAGES[ERROR_CODES.AI_PROVIDER_NOT_FOUND],
      404
    );
  }

  return {
    baseUrl: provider.baseUrl,
    apiKey: provider.encryptedApiKey,
    type: provider.type,
    supportsStreaming: true,
    supportsTools: provider.type === 'mistral',
    freeTier: getFreeTierInfo(provider.type),
  };
};

const getFreeTierInfo = (providerType: string): AIProviderConfig['freeTier'] => {
  const freeTierMap: Record<string, AIProviderConfig['freeTier']> = {
    mistral: { available: true, rateLimit: 60, dailyLimit: 500000, tokenLimit: 1000000000 },
    groq: { available: true, rateLimit: 30, dailyLimit: 14400, tokenLimit: 0 },
    openrouter: { available: true, rateLimit: 20, dailyLimit: 50, tokenLimit: 0 },
    custom: { available: false, rateLimit: 0, dailyLimit: 0, tokenLimit: 0 },
  };
  return freeTierMap[providerType] || freeTierMap.custom;
};

// Get AI model configuration
const getAIModel = async (modelId: string, providerId: string, userId: string): Promise<AIModel> => {
  // If no model specified, use default
  if (!modelId) {
    return {
      id: generateId(),
      providerId: providerId || APP_CONFIG.AI_DEFAULT_PROVIDER,
      name: APP_CONFIG.AI_DEFAULT_MODEL,
      displayName: APP_CONFIG.AI_DEFAULT_MODEL,
      contextWindow: TOKEN_LIMITS.DEFAULT_CONTEXT_WINDOW,
      maxTokens: TOKEN_LIMITS.MAX_TOKENS_PER_REQUEST,
      supportsStreaming: true,
      supportsTools: false,
      isFree: true,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
  }

  // Check cache first
  const cacheKey = `${providerId || 'default'}:${userId}`;
  if (modelsCache[cacheKey] && Date.now() - lastCacheUpdate.getTime() < CACHE_TTL) {
    const model = modelsCache[cacheKey].find(m => m.id === modelId || m.name === modelId);
    if (model) return model;
  }

  // Get from database
  const model = await db.query.aiModels.findFirst({
    where: eq(aiModels.id, modelId),
  });

  if (model) {
    return {
      ...model,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt),
    };
  }

  // If not found in database, create a temporary model config
  return {
    id: generateId(),
    providerId: providerId || APP_CONFIG.AI_DEFAULT_PROVIDER,
    name: modelId,
    displayName: modelId,
    contextWindow: TOKEN_LIMITS.DEFAULT_CONTEXT_WINDOW,
    maxTokens: TOKEN_LIMITS.MAX_TOKENS_PER_REQUEST,
    supportsStreaming: true,
    supportsTools: false,
    isFree: true,
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  };
};

// Get model profile settings
const getModelProfileSettings = (profile: string) => {
  const profileConfig = MODEL_PROFILES[profile as keyof typeof MODEL_PROFILES];
  if (!profileConfig) {
    return MODEL_PROFILES.FAST;
  }
  return profileConfig;
};

// Build the request payload for different providers
const buildRequestPayload = (
  message: string,
  model: AIModel,
  provider: AIProviderConfig,
  options: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string[];
    conversationId?: string;
  } = {}
) => {
  const {
    maxTokens = model.maxTokens || TOKEN_LIMITS.MAX_TOKENS_PER_REQUEST,
    temperature = 0.7,
    topP = 0.9,
  } = options;

  switch (provider.type) {
    case 'mistral':
      return {
        model: model.name,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream: false,
      };

    case 'groq':
      return {
        model: model.name,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream: false,
      };

    case 'openrouter':
      return {
        model: model.name,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream: false,
      };

    default:
      return {
        prompt: message,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
      };
  }
};

// Call AI provider with improved error handling and free tier checks
const callProvider = async (
  provider: AIProviderConfig,
  model: AIModel,
  payload: Record<string, unknown>,
  apiKey?: string
): Promise<{
  message: string;
  model: string;
  provider: string;
  tokenUsage?: TokenUsage;
  sources?: SourceReference[];
  toolCalls?: ToolCall[];
}> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    if (!apiKey) {
      console.warn('No API key provided for AI provider. Returning mock response.');
      const providerName = provider.type === 'mistral' ? 'Mistral AI' :
                          provider.type === 'groq' ? 'Groq' :
                          provider.type === 'openrouter' ? 'OpenRouter' :
                          provider.type;
      return {
        message: `To jest demonstracyjna odpowiedz od ${providerName}. Dodaj klucz API w ustawieniach, aby uzyskac prawdziwe odpowiedzi. Darmowy tier: ${provider.freeTier.dailyLimit}/dzien, ${provider.freeTier.rateLimit}/min`,
        model: model.name,
        provider: provider.type,
        tokenUsage: { promptTokens: 25, completionTokens: 50, totalTokens: 75 },
        sources: [],
        toolCalls: [],
      };
    }

    const response = await axios.post(`${provider.baseUrl}/v1/chat/completions`, payload, {
      headers,
      timeout: 60000,
    });

    const data = response.data;

    switch (provider.type) {
      case 'mistral':
      case 'groq':
      case 'openrouter':
        if (data.choices && data.choices[0]) {
          const choice = data.choices[0];
          return {
            message: choice.message?.content || choice.text || '',
            model: data.model || model.name,
            provider: provider.type,
            tokenUsage: {
              promptTokens: data.usage?.prompt_tokens || 0,
              completionTokens: data.usage?.completion_tokens || 0,
              totalTokens: data.usage?.total_tokens || 0,
            },
            sources: [],
            toolCalls: choice.message?.tool_calls || [],
          };
        }
        break;
      default:
        if (data.outputs && data.outputs[0]) {
          return {
            message: data.outputs[0].text || '',
            model: model.name,
            provider: provider.type,
            tokenUsage: {
              promptTokens: data.usage?.input_tokens || 0,
              completionTokens: data.usage?.output_tokens || 0,
              totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
            sources: [],
            toolCalls: [],
          };
        }
    }

    return {
      message: data.text || data.content || data.output || 'Brak odpowiedzi',
      model: model.name,
      provider: provider.type,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      sources: [],
      toolCalls: [],
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    if (status === 401) {
      throw createError(
        ERROR_CODES.AI_PROVIDER_INVALID_KEY,
        ERROR_MESSAGES[ERROR_CODES.AI_PROVIDER_INVALID_KEY],
        401
      );
    }

    if (status === 429) {
      throw createError(
        ERROR_CODES.AI_PROVIDER_RATE_LIMITED,
        `Limit dostawcy AI zostal wyczerpany. Darmowy tier: ${provider.freeTier.rateLimit}/min, ${provider.freeTier.dailyLimit}/dzien`,
        429
      );
    }

    if (status === 404) {
      throw createError(
        ERROR_CODES.AI_MODEL_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.AI_MODEL_NOT_FOUND],
        404
      );
    }

    console.error('AI Provider Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Response data:', data);

    throw createError(
      ERROR_CODES.AI_PROVIDER_ERROR,
      `${ERROR_MESSAGES[ERROR_CODES.AI_PROVIDER_ERROR]}: ${provider.type}`,
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
};

// Main AI service function with Context Builder integration
export const callAI = async (request: AIRequest): Promise<ChatResponse> => {
  try {
    if (!APP_CONFIG.AI_ENABLED) {
      throw createError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'AI jest wyłączony w konfiguracji',
        503
      );
    }

    // Get provider configuration
    const provider = await getAIProvider(request.provider || '', request.userId);

    // Get model configuration
    const model = await getAIModel(
      request.model || '',
      request.provider || '',
      request.userId
    );

    // Check if we should use FREE-FIRST routing
    const useFreeFirst = request.freeFirst ?? APP_CONFIG.FREE_FIRST_MODE !== 'false';

    // If FREE-FIRST, try to use free tier providers first
    let selectedProvider = provider;
    let selectedModel = model;

    if (useFreeFirst) {
      const freeProviderResult = await tryFreeTierProviders(
        request.userId,
        request.message,
        request.conversationId,
        request.projectId,
        request.provider
      );

      if (freeProviderResult) {
        selectedProvider = freeProviderResult.provider;
        selectedModel = freeProviderResult.model;
      } else {
        // No free provider available - check if we should fail or use paid
        if (APP_CONFIG.FREE_ONLY_MODE === 'true') {
          throw createError(
            ERROR_CODES.AI_PROVIDER_RATE_LIMITED,
            'Brak dostępnych darmowych opcji AI. Dodaj klucz API dostawcy z darmowym tierem.',
            429
          );
        }
        // Continue with user's selected provider (may be paid)
      }
    }

    // Build context using Context Builder
    const contextResult = await buildContext({
      userId: request.userId,
      message: request.message,
      conversationId: request.conversationId,
      projectId: request.projectId,
      maxContextTokens: request.maxTokens || TOKEN_LIMITS.DEFAULT_CONTEXT_WINDOW,
    });

    // Build request payload with context
    const payload = buildRequestPayloadWithContext(
      request.message,
      selectedModel,
      selectedProvider,
      contextResult,
      {
        maxTokens: request.maxTokens,
        conversationId: request.conversationId,
        temperature: request.temperature,
        topP: request.topP,
      }
    );

    // Call the provider
    const response = await callProvider(
      selectedProvider,
      selectedModel,
      payload,
      selectedProvider.apiKey
    );

    return {
      id: generateId(),
      conversationId: request.conversationId || '',
      message: response.message,
      role: 'assistant',
      status: 'completed',
      model: response.model,
      provider: response.provider,
      tokenUsage: response.tokenUsage,
      sources: contextResult.sources,
      toolCalls: response.toolCalls,
      metadata: {
        contextTokens: contextResult.usedTokens,
        contextEntries: contextResult.memoryEntries.length,
        conflicts: contextResult.conflicts.length,
        intent: contextResult.context.find(c => c.type === 'intent')?.content,
      },
      createdAt: now(),
    };
  } catch (err) {
    throw err;
  }
};

// Try free tier providers in order of preference
const tryFreeTierProviders = async (
  userId: string,
  message: string,
  conversationId?: string,
  projectId?: string,
  preferredProviderId?: string
): Promise<{ provider: AIProviderConfig; model: AIModel } | null> => {
  // Provider priority for FREE-FIRST: Groq > Mistral > OpenRouter
  const providerPriority = ['groq', 'mistral', 'openrouter'];

  // If user has a preferred provider, try it first
  if (preferredProviderId) {
    const preferredProvider = AI_PROVIDERS[preferredProviderId as keyof typeof AI_PROVIDERS];
    if (preferredProvider && preferredProvider.FREE_TIER) {
      try {
        const providerConfig = await getAIProvider(preferredProviderId, userId);
        const model = await getAIModel('', preferredProviderId, userId);
        
        if (providerConfig.freeTier.available) {
          return { provider: providerConfig, model };
        }
      } catch {
        // Provider not available, continue with priority list
      }
    }
  }

  // Try providers in priority order
  for (const providerType of providerPriority) {
    const provider = AI_PROVIDERS[providerType as keyof typeof AI_PROVIDERS];
    if (!provider || !provider.FREE_TIER) continue;

    try {
      // Check if user has this provider configured
      const userProvider = await db.query.aiProviders.findFirst({
        where: and(
          eq(aiProviders.userId, userId),
          eq(aiProviders.type, providerType),
          eq(aiProviders.isActive, 1),
          eq(aiProviders.isVerified, 1)
        ),
        orderBy: desc(aiProviders.updatedAt),
      });

      if (userProvider) {
        const providerConfig = await getAIProvider(userProvider.id, userId);
        const model = await getAIModel('', userProvider.id, userId);
        
        if (providerConfig.freeTier.available && providerConfig.apiKey) {
          return { provider: providerConfig, model };
        }
      }
    } catch {
      continue;
    }
  }

  // No free provider available
  return null;
};

// Build request payload with context from Context Builder
const buildRequestPayloadWithContext = (
  message: string,
  model: AIModel,
  provider: AIProviderConfig,
  contextResult: ContextBuilderResult,
  options: {
    maxTokens?: number;
    conversationId?: string;
    temperature?: number;
    topP?: number;
  } = {}
) => {
  const {
    maxTokens = model.maxTokens || TOKEN_LIMITS.MAX_TOKENS_PER_REQUEST,
    temperature = 0.7,
    topP = 0.9,
  } = options;

  // Build system message with context
  const systemMessages: Array<{ role: 'system'; content: string }> = [];

  // Add context chunks as system messages
  for (const chunk of contextResult.context) {
    systemMessages.push({
      role: 'system',
      content: chunk.content,
    });
  }

  switch (provider.type) {
    case 'mistral':
      return {
        model: model.name,
        messages: [
          ...systemMessages,
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream: false,
      };

    case 'groq':
      return {
        model: model.name,
        messages: [
          ...systemMessages,
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream: false,
      };

    case 'openrouter':
      return {
        model: model.name,
        messages: [
          ...systemMessages,
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream: false,
      };

    default:
      return {
        prompt: message,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
      };
  }
};

// Get available AI providers for a user
export const getAIProviders = async (userId: string): Promise<AIProvider[]> => {
  const providers = await db.query.aiProviders.findMany({
    where: eq(aiProviders.userId, userId),
    orderBy: desc(aiProviders.createdAt),
  });

  return providers.map(provider => ({
    ...provider,
    createdAt: new Date(provider.createdAt),
    updatedAt: new Date(provider.updatedAt),
    verificationDate: provider.verificationDate ? new Date(provider.verificationDate) : undefined,
  }));
};

// Add a new AI provider
export const addAIProvider = async (
  userId: string,
  data: {
    name: string;
    type: 'mistral' | 'groq' | 'openrouter' | 'custom';
    baseUrl: string;
    apiKey: string;
    isActive?: boolean;
  }
): Promise<AIProvider> => {
  const providerId = generateId();
  const nowDate = now();

  // For demo purposes, we'll store the API key as-is
  // In production, this should be encrypted
  const encryptedApiKey = data.apiKey; // TODO: Implement encryption

  await db.insert(aiProviders).values({
    id: providerId,
    userId,
    name: data.name,
    type: data.type,
    baseUrl: data.baseUrl,
    encryptedApiKey,
    isActive: data.isActive ?? true,
    isVerified: false,
    createdAt: nowDate,
    updatedAt: nowDate,
  });

  const provider = await db.query.aiProviders.findFirst({
    where: eq(aiProviders.id, providerId),
  });

  if (!provider) {
    throw createError(
      ERROR_CODES.DB_QUERY_ERROR,
      ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
      500
    );
  }

  return {
    ...provider,
    apiKey: undefined, // Don't return the API key
    createdAt: new Date(provider.createdAt),
    updatedAt: new Date(provider.updatedAt),
    verificationDate: provider.verificationDate ? new Date(provider.verificationDate) : undefined,
  };
};

// Update an AI provider
export const updateAIProvider = async (
  userId: string,
  providerId: string,
  data: {
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    isActive?: boolean;
  }
): Promise<AIProvider> => {
  const nowDate = now();

  // Get current provider to check ownership
  const provider = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.id, providerId),
      eq(aiProviders.userId, userId)
    ),
  });

  if (!provider) {
    throw createError(
      ERROR_CODES.AI_PROVIDER_NOT_FOUND,
      ERROR_MESSAGES[ERROR_CODES.AI_PROVIDER_NOT_FOUND],
      404
    );
  }

  // For demo purposes, we'll store the API key as-is
  // In production, this should be encrypted
  const encryptedApiKey = data.apiKey ? data.apiKey : provider.encryptedApiKey;

  await db
    .update(aiProviders)
    .set({
      name: data.name,
      baseUrl: data.baseUrl,
      encryptedApiKey,
      isActive: data.isActive,
      updatedAt: nowDate,
    })
    .where(eq(aiProviders.id, providerId));

  const updatedProvider = await db.query.aiProviders.findFirst({
    where: eq(aiProviders.id, providerId),
  });

  if (!updatedProvider) {
    throw createError(
      ERROR_CODES.DB_QUERY_ERROR,
      ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
      500
    );
  }

  return {
    ...updatedProvider,
    apiKey: undefined, // Don't return the API key
    createdAt: new Date(updatedProvider.createdAt),
    updatedAt: new Date(updatedProvider.updatedAt),
    verificationDate: updatedProvider.verificationDate ? new Date(updatedProvider.verificationDate) : undefined,
  };
};

// Delete an AI provider
export const deleteAIProvider = async (userId: string, providerId: string): Promise<void> => {
  // Get current provider to check ownership
  const provider = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.id, providerId),
      eq(aiProviders.userId, userId)
    ),
  });

  if (!provider) {
    throw createError(
      ERROR_CODES.AI_PROVIDER_NOT_FOUND,
      ERROR_MESSAGES[ERROR_CODES.AI_PROVIDER_NOT_FOUND],
      404
    );
  }

  await db.delete(aiProviders).where(eq(aiProviders.id, providerId));
};

// Verify an AI provider
export const verifyAIProvider = async (userId: string, providerId: string): Promise<AIProvider> => {
  // Get provider
  const provider = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.id, providerId),
      eq(aiProviders.userId, userId)
    ),
  });

  if (!provider) {
    throw createError(
      ERROR_CODES.AI_PROVIDER_NOT_FOUND,
      ERROR_MESSAGES[ERROR_CODES.AI_PROVIDER_NOT_FOUND],
      404
    );
  }

  // Try to call the provider with a simple request
  try {
    // For demo purposes, we'll just mark it as verified
    // In production, we would make a test API call
    await db
      .update(aiProviders)
      .set({
        isVerified: true,
        verificationDate: now(),
        updatedAt: now(),
      })
      .where(eq(aiProviders.id, providerId));

    const updatedProvider = await db.query.aiProviders.findFirst({
      where: eq(aiProviders.id, providerId),
    });

    if (!updatedProvider) {
      throw createError(
        ERROR_CODES.DB_QUERY_ERROR,
        ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
        500
      );
    }

    return {
      ...updatedProvider,
      apiKey: undefined, // Don't return the API key
      createdAt: new Date(updatedProvider.createdAt),
      updatedAt: new Date(updatedProvider.updatedAt),
      verificationDate: updatedProvider.verificationDate ? new Date(updatedProvider.verificationDate) : undefined,
    };
  } catch (error) {
    // Update with verification error
    await db
      .update(aiProviders)
      .set({
        isVerified: false,
        updatedAt: now(),
      })
      .where(eq(aiProviders.id, providerId));

    throw createError(
      ERROR_CODES.AI_PROVIDER_INVALID_KEY,
      ERROR_MESSAGES[ERROR_CODES.AI_PROVIDER_INVALID_KEY],
      401
    );
  }
};

// Get available models for a provider
export const getModels = async (providerId: string, userId: string): Promise<AIModel[]> => {
  // Check cache first
  const cacheKey = `${providerId}:${userId}`;
  if (modelsCache[cacheKey] && Date.now() - lastCacheUpdate.getTime() < CACHE_TTL) {
    return modelsCache[cacheKey];
  }

  // Get from database
  const models = await db.query.aiModels.findMany({
    where: eq(aiModels.providerId, providerId),
    orderBy: asc(aiModels.displayName),
  });

  // Update cache
  modelsCache[cacheKey] = models.map(model => ({
    ...model,
    createdAt: new Date(model.createdAt),
    updatedAt: new Date(model.updatedAt),
  }));
  lastCacheUpdate = new Date();

  return modelsCache[cacheKey];
};

// Refresh models cache for a provider
export const refreshModels = async (providerId: string, userId: string): Promise<AIModel[]> => {
  // In a real implementation, we would fetch models from the provider's API
  // For now, we'll just return the cached models or database models
  
  const cacheKey = `${providerId}:${userId}`;
  
  // Get from database
  const models = await db.query.aiModels.findMany({
    where: eq(aiModels.providerId, providerId),
    orderBy: asc(aiModels.displayName),
  });

  // Update cache
  modelsCache[cacheKey] = models.map(model => ({
    ...model,
    createdAt: new Date(model.createdAt),
    updatedAt: new Date(model.updatedAt),
  }));
  lastCacheUpdate = new Date();

  return modelsCache[cacheKey];
};

// Get default provider for a user
export const getDefaultProvider = async (userId: string): Promise<AIProvider | null> => {
  // Try to get user's default provider
  const provider = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.userId, userId),
      eq(aiProviders.isActive, 1)
    ),
    orderBy: desc(aiProviders.isVerified),
  });

  if (provider) {
    return {
      ...provider,
      apiKey: undefined, // Don't return the API key
      createdAt: new Date(provider.createdAt),
      updatedAt: new Date(provider.updatedAt),
      verificationDate: provider.verificationDate ? new Date(provider.verificationDate) : undefined,
    };
  }

  // Return null, indicating no user-specific provider
  return null;
};

// Import needed for the and function
import { and } from 'drizzle-orm';
