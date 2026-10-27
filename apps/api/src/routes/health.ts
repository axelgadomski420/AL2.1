import { Hono } from 'hono';
import { db } from '../config/database';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { APP_CONFIG, ERROR_CODES, ERROR_MESSAGES, type HealthStatus, type APIResponse } from '@al/shared';
import { now } from '@al/shared';

const healthRouter = new Hono();

// Health check endpoint
healthRouter.get('/', async (c) => {
  const startTime = Date.now();

  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: now(),
    version: APP_CONFIG.VERSION,
    services: {
      database: { status: 'up' },
      api: { status: 'up' },
    },
  };

  try {
    // Check database connection
    await db.query.users.findFirst({
      where: eq(users.id, 'test'),
    });
    healthStatus.services.database = {
      status: 'up',
      latency: Date.now() - startTime,
      lastCheck: now(),
    };
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.services.database = {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: now(),
    };
  }

  // Check API status
  healthStatus.services.api = {
    status: 'up',
    latency: Date.now() - startTime,
    lastCheck: now(),
  };

  // Determine overall status
  const serviceStatuses = Object.values(healthStatus.services).map(s => s.status);
  if (serviceStatuses.includes('down')) {
    healthStatus.status = 'unhealthy';
  } else if (serviceStatuses.includes('degraded')) {
    healthStatus.status = 'degraded';
  }

  return c.json<APIResponse<HealthStatus>>({
    success: true,
    data: healthStatus,
  });
});

// Detailed health check with more information
healthRouter.get('/detailed', async (c) => {
  const startTime = Date.now();

  const healthStatus: HealthStatus & {
    environment: string;
    uptime: number;
    memory?: {
      used: number;
      total: number;
    };
  } = {
    status: 'healthy',
    timestamp: now(),
    version: APP_CONFIG.VERSION,
    environment: APP_CONFIG.NODE_ENV,
    uptime: process.uptime(),
    services: {
      database: { status: 'up' },
      api: { status: 'up' },
    },
  };

  // Add memory info if available
  if (global.gc) {
    healthStatus.memory = {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
    };
  }

  try {
    // Check database connection
    const dbStart = Date.now();
    await db.query.users.findFirst({
      where: eq(users.id, 'test'),
    });
    healthStatus.services.database = {
      status: 'up',
      latency: Date.now() - dbStart,
      lastCheck: now(),
    };
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.services.database = {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: now(),
    };
  }

  // Check API status
  healthStatus.services.api = {
    status: 'up',
    latency: Date.now() - startTime,
    lastCheck: now(),
  };

  // Determine overall status
  const serviceStatuses = Object.values(healthStatus.services).map(s => s.status);
  if (serviceStatuses.includes('down')) {
    healthStatus.status = 'unhealthy';
  } else if (serviceStatuses.includes('degraded')) {
    healthStatus.status = 'degraded';
  }

  return c.json<APIResponse<typeof healthStatus>>({
    success: true,
    data: healthStatus,
  });
});

// Version endpoint
healthRouter.get('/version', (c) => {
  return c.json<APIResponse<{
    version: string;
    name: string;
    fullName: string;
    description: string;
    timestamp: Date;
  }>>({
    success: true,
    data: {
      version: APP_CONFIG.VERSION,
      name: APP_CONFIG.NAME,
      fullName: APP_CONFIG.FULL_NAME,
      description: APP_CONFIG.DESCRIPTION,
      timestamp: now(),
    },
  });
});

// Ping endpoint (for load balancer health checks)
healthRouter.get('/ping', (c) => {
  return c.json({
    status: 'ok',
    timestamp: now().toISOString(),
  });
});

// Readiness check
healthRouter.get('/ready', async (c) => {
  try {
    // Check database connection
    await db.query.users.findFirst({
      where: eq(users.id, 'test'),
    });

    return c.json({
      status: 'ready',
      timestamp: now().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        status: 'not ready',
        timestamp: now().toISOString(),
        error: 'Database connection failed',
      },
      503
    );
  }
});

// Liveness check
healthRouter.get('/live', (c) => {
  return c.json({
    status: 'alive',
    timestamp: now().toISOString(),
  });
});

export default healthRouter;
