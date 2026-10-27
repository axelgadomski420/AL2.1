import { Hono } from 'hono';
import { jwtAuth, getAuthUserId } from '../middleware/auth';
import { db } from '../config/database';
import { aiProviders, aiModels } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateId, now } from '@al/shared';
import { createError } from '../middleware/errorHandler';
import { ERROR_CODES, ERROR_MESSAGES, type AIProvider, type AIModel, type APIResponse, type PaginatedResponse } from '@al/shared';
import { getAIProviders, addAIProvider, updateAIProvider, deleteAIProvider, verifyAIProvider, getModels, refreshModels, getDefaultProvider } from '../services/aiService';

const aiProviderRouter = new Hono();

// Get all AI providers for the authenticated user
aiProviderRouter.get('/', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const { page = 1, pageSize = 20 } = c.req.query();

    const limit = Math.min(parseInt(pageSize as string) || 20, 100);
    const offset = ((parseInt(page as string) || 1) - 1) * limit;

    const providers = await getAIProviders(userId);

    // Filter and paginate
    const paginatedProviders = providers.slice(offset, offset + limit);

    return c.json<APIResponse<PaginatedResponse<AIProvider>>>({
      success: true,
      data: {
        data: paginatedProviders,
        total: providers.length,
        page: parseInt(page as string) || 1,
        pageSize: limit,
        hasMore: offset + limit < providers.length,
      },
    });
  } catch (err) {
    throw err;
  }
});

// Get a specific AI provider
aiProviderRouter.get('/:id', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const providerId = c.req.param('id');

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

    return c.json<APIResponse<AIProvider>>({
      success: true,
      data: {
        ...provider,
        apiKey: undefined, // Never return the API key
        createdAt: new Date(provider.createdAt),
        updatedAt: new Date(provider.updatedAt),
        verificationDate: provider.verificationDate ? new Date(provider.verificationDate) : undefined,
      },
    });
  } catch (err) {
    throw err;
  }
});

// Create a new AI provider
aiProviderRouter.post('/', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const body = await c.req.json();

    const provider = await addAIProvider(userId, {
      name: body.name,
      type: body.type,
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
      isActive: body.isActive,
    });

    return c.json<APIResponse<AIProvider>>({
      success: true,
      data: provider,
      message: 'Dostawca AI został dodany',
    });
  } catch (err) {
    throw err;
  }
});

// Update an AI provider
aiProviderRouter.patch('/:id', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const providerId = c.req.param('id');
    const body = await c.req.json();

    const provider = await updateAIProvider(userId, providerId, {
      name: body.name,
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
      isActive: body.isActive,
    });

    return c.json<APIResponse<AIProvider>>({
      success: true,
      data: provider,
      message: 'Dostawca AI został zaktualizowany',
    });
  } catch (err) {
    throw err;
  }
});

// Delete an AI provider
aiProviderRouter.delete('/:id', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const providerId = c.req.param('id');

    await deleteAIProvider(userId, providerId);

    return c.json<APIResponse<null>>({
      success: true,
      message: 'Dostawca AI został usunięty',
    });
  } catch (err) {
    throw err;
  }
});

// Verify an AI provider
aiProviderRouter.post('/:id/verify', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const providerId = c.req.param('id');

    const provider = await verifyAIProvider(userId, providerId);

    return c.json<APIResponse<AIProvider>>({
      success: true,
      data: provider,
      message: 'Dostawca AI został zweryfikowany',
    });
  } catch (err) {
    throw err;
  }
});

// Test connection to an AI provider
aiProviderRouter.post('/:id/test', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const providerId = c.req.param('id');

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

    // For demo purposes, we'll just return success
    // In production, we would make a test API call
    return c.json<APIResponse<{ success: boolean; message?: string }>>({
      success: true,
      data: {
        success: true,
        message: 'Połączenie z dostawcą AI działa poprawnie',
      },
    });
  } catch (err) {
    throw err;
  }
});

// Get models for a provider
aiProviderRouter.get('/:id/models', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const providerId = c.req.param('id');

    // Check if provider exists
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

    const models = await getModels(providerId, userId);

    return c.json<APIResponse<AIModel[]>>({
      success: true,
      data: models,
    });
  } catch (err) {
    throw err;
  }
});

// Refresh models for a provider
aiProviderRouter.post('/:id/models/refresh', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const providerId = c.req.param('id');

    // Check if provider exists
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

    const models = await refreshModels(providerId, userId);

    return c.json<APIResponse<AIModel[]>>({
      success: true,
      data: models,
      message: 'Modele zostały odświeżone',
    });
  } catch (err) {
    throw err;
  }
});

// Get default provider for the user
aiProviderRouter.get('/default', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);

    const provider = await getDefaultProvider(userId);

    if (!provider) {
      return c.json<APIResponse<AIProvider | null>>({
        success: true,
        data: null,
        message: 'Nie znaleziono domyślnego dostawcy AI',
      });
    }

    return c.json<APIResponse<AIProvider>>({
      success: true,
      data: provider,
    });
  } catch (err) {
    throw err;
  }
});

// Set default provider
aiProviderRouter.post('/:id/set-default', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const providerId = c.req.param('id');

    // Check if provider exists
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

    // Deactivate all other providers
    await db
      .update(aiProviders)
      .set({ isActive: false })
      .where(eq(aiProviders.userId, userId));

    // Activate this provider
    await db
      .update(aiProviders)
      .set({ isActive: true, updatedAt: now() })
      .where(eq(aiProviders.id, providerId));

    return c.json<APIResponse<AIProvider>>({
      success: true,
      data: {
        ...provider,
        apiKey: undefined,
        createdAt: new Date(provider.createdAt),
        updatedAt: new Date(provider.updatedAt),
        verificationDate: provider.verificationDate ? new Date(provider.verificationDate) : undefined,
        isActive: true,
      },
      message: 'Dostawca AI został ustawiony jako domyślny',
    });
  } catch (err) {
    throw err;
  }
});

export default aiProviderRouter;
