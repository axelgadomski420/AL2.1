import { getEnv } from '@al/shared';

// Application configuration
export const APP_CONFIG = {
  // Environment
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  IS_PRODUCTION: getEnv('NODE_ENV') === 'production',
  IS_DEVELOPMENT: getEnv('NODE_ENV') === 'development',
  IS_TEST: getEnv('NODE_ENV') === 'test',

  // Server Configuration
  PORT: parseInt(getEnv('PORT', '4000'), 10),
  HOST: getEnv('HOST', 'localhost'),

  // CORS Configuration
  CORS_ORIGIN: getEnv('CORS_ORIGIN', '*'),
  CORS_METHODS: getEnv('CORS_METHODS', 'GET,HEAD,PUT,PATCH,POST,DELETE'),
  CORS_HEADERS: getEnv('CORS_HEADERS', '*'),

  // API Configuration
  API_PREFIX: getEnv('API_PREFIX', '/api'),
  API_VERSION: getEnv('API_VERSION', 'v1'),

  // Logging Configuration
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
  LOG_FORMAT: getEnv('LOG_FORMAT', 'json'),
  LOG_PRETTY: getEnv('LOG_PRETTY', 'false') === 'true',

  // Security Configuration
  TRUST_PROXY: getEnv('TRUST_PROXY', 'false') === 'true',
  MAX_REQUEST_SIZE: getEnv('MAX_REQUEST_SIZE', '10mb'),

  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(getEnv('RATE_LIMIT_WINDOW', '60'), 10), // seconds
  RATE_LIMIT_MAX_REQUESTS: parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS', '60'), 10),

  // File Upload Configuration
  UPLOAD_DIR: getEnv('UPLOAD_DIR', './uploads'),
  MAX_FILE_SIZE: parseInt(getEnv('MAX_FILE_SIZE', '10485760'), 10), // 10MB
  ALLOWED_MIME_TYPES: getEnv('ALLOWED_MIME_TYPES', 'text/plain,text/markdown,application/pdf,application/json,image/png,image/jpeg').split(','),

  // AI Configuration
  AI_ENABLED: getEnv('AI_ENABLED', 'true') === 'true',
  AI_DEFAULT_PROVIDER: getEnv('AI_DEFAULT_PROVIDER', 'groq'),
  AI_DEFAULT_MODEL: getEnv('AI_DEFAULT_MODEL', 'llama-3.1-70b-versatile'),
  FREE_FIRST_MODE: getEnv('FREE_FIRST_MODE', 'true') === 'true',
  FREE_ONLY_MODE: getEnv('FREE_ONLY_MODE', 'false') === 'true',

  // Memory Configuration
  MEMORY_ENABLED: getEnv('MEMORY_ENABLED', 'true') === 'true',
  MEMORY_INDEX_BATCH_SIZE: parseInt(getEnv('MEMORY_INDEX_BATCH_SIZE', '100'), 10),

  // Search Configuration
  SEARCH_ENABLED: getEnv('SEARCH_ENABLED', 'true') === 'true',

  // Feature Flags
  FEATURE_AI: getEnv('FEATURE_AI', 'true') === 'true',
  FEATURE_FILES: getEnv('FEATURE_FILES', 'true') === 'true',
  FEATURE_MEMORY: getEnv('FEATURE_MEMORY', 'true') === 'true',
  FEATURE_PROJECTS: getEnv('FEATURE_PROJECTS', 'true') === 'true',
  FEATURE_TASKS: getEnv('FEATURE_TASKS', 'true') === 'true',
  FEATURE_INTEGRATIONS: getEnv('FEATURE_INTEGRATIONS', 'false') === 'true',
  FEATURE_VOICE: getEnv('FEATURE_VOICE', 'false') === 'true',
};

// Validate production configuration
if (APP_CONFIG.IS_PRODUCTION) {
  if (APP_CONFIG.CORS_ORIGIN === '*') {
    console.warn('⚠️  WARNING: CORS_ORIGIN is set to "*" in production. Consider setting a specific origin.');
  }
  if (APP_CONFIG.JWT_SECRET === 'al-jwt-secret-change-in-production') {
    console.error('❌ ERROR: JWT_SECRET is not set in production!');
  }
  if (APP_CONFIG.ENCRYPTION_KEY === 'al-encryption-key-change-in-production') {
    console.error('❌ ERROR: ENCRYPTION_KEY is not set in production!');
  }
}

// Export environment-specific configuration
let envConfig: Record<string, string> = {};

if (APP_CONFIG.IS_PRODUCTION) {
  envConfig = {
    DATABASE_URL: getEnv('PROD_DATABASE_URL', ''),
    JWT_SECRET: getEnv('PROD_JWT_SECRET', ''),
    ENCRYPTION_KEY: getEnv('PROD_ENCRYPTION_KEY', ''),
  };
} else if (APP_CONFIG.IS_DEVELOPMENT) {
  envConfig = {
    DATABASE_URL: getEnv('DEV_DATABASE_URL', 'file:./local.db'),
    JWT_SECRET: getEnv('DEV_JWT_SECRET', 'al-dev-secret'),
    ENCRYPTION_KEY: getEnv('DEV_ENCRYPTION_KEY', 'al-dev-encryption-key'),
  };
}

export { envConfig };
