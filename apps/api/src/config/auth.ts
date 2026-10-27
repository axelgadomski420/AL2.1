import { getEnv } from '@al/shared';

// Authentication configuration
export const AUTH_CONFIG = {
  // JWT Configuration
  JWT_SECRET: getEnv('JWT_SECRET', 'al-jwt-secret-change-in-production'),
  JWT_EXPIRY: getEnv('JWT_EXPIRY', '24h'),
  JWT_ISSUER: getEnv('JWT_ISSUER', 'al-assistant'),
  JWT_AUDIENCE: getEnv('JWT_AUDIENCE', 'al-client'),

  // Password Configuration
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_HASH_ROUNDS: 12,

  // Session Configuration
  SESSION_SECRET: getEnv('SESSION_SECRET', 'al-session-secret-change-in-production'),
  SESSION_MAX_AGE: 24 * 60 * 60, // 24 hours in seconds

  // Rate Limiting for Auth
  MAX_FAILED_LOGINS: 5,
  LOCKOUT_DURATION: 15 * 60, // 15 minutes in seconds

  // Encryption Configuration
  ENCRYPTION_KEY: getEnv('ENCRYPTION_KEY', 'al-encryption-key-change-in-production'),
  ENCRYPTION_VERSION: 1,
};

// Validate configuration
if (AUTH_CONFIG.JWT_SECRET === 'al-jwt-secret-change-in-production') {
  console.warn('⚠️  WARNING: Using default JWT secret. Please set JWT_SECRET environment variable.');
}

if (AUTH_CONFIG.ENCRYPTION_KEY === 'al-encryption-key-change-in-production') {
  console.warn('⚠️  WARNING: Using default encryption key. Please set ENCRYPTION_KEY environment variable.');
}

// Export helper functions
export const getJwtExpiryInSeconds = (): number => {
  const expiry = AUTH_CONFIG.JWT_EXPIRY;
  if (expiry.endsWith('h')) {
    return parseInt(expiry.slice(0, -1), 10) * 60 * 60;
  }
  if (expiry.endsWith('m')) {
    return parseInt(expiry.slice(0, -1), 10) * 60;
  }
  if (expiry.endsWith('s')) {
    return parseInt(expiry.slice(0, -1), 10);
  }
  if (expiry.endsWith('d')) {
    return parseInt(expiry.slice(0, -1), 10) * 24 * 60 * 60;
  }
  return parseInt(expiry, 10);
};
