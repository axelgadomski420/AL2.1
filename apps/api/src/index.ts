import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { chatRouter } from './routes/chat';
import { projectRouter } from './routes/projects';
import { taskRouter } from './routes/tasks';
import { memoryRouter } from './routes/memory';
import { fileRouter } from './routes/files';
import { aiProviderRouter } from './routes/aiProviders';
import { integrationRouter } from './routes/integrations';
import { searchRouter } from './routes/search';
import { healthRouter } from './routes/health';
import { APP_CONFIG, API_CONFIG } from '@al/shared';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());
app.use('*', rateLimiter);

// Error handling
app.onError(errorHandler);

// Routes
app.route('/auth', authRouter);
app.route('/users', userRouter);
app.route('/chat', chatRouter);
app.route('/projects', projectRouter);
app.route('/tasks', taskRouter);
app.route('/memory', memoryRouter);
app.route('/files', fileRouter);
app.route('/ai-providers', aiProviderRouter);
app.route('/integrations', integrationRouter);
app.route('/search', searchRouter);
app.route('/health', healthRouter);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: APP_CONFIG.NAME,
    fullName: APP_CONFIG.FULL_NAME,
    description: APP_CONFIG.DESCRIPTION,
    version: APP_CONFIG.VERSION,
    apiVersion: API_CONFIG.VERSION,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint nie istnieje',
        timestamp: new Date().toISOString(),
      },
    },
    404
  );
});

const port = parseInt(process.env.PORT || '4000', 10);

console.log(`${APP_CONFIG.NAME} API server starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};

// Export app for testing
export { app };
