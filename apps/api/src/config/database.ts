import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { getEnv } from '@al/shared';

// Database configuration
const DB_CONFIG = {
  url: getEnv('DATABASE_URL', 'file:./local.db'),
  authToken: getEnv('DATABASE_AUTH_TOKEN', ''),
};

// Create database client
const client = createClient({
  url: DB_CONFIG.url,
  authToken: DB_CONFIG.authToken,
});

// Create Drizzle ORM instance
export const db = drizzle(client);

// For testing purposes, export the client
// This allows for transaction support in tests
export const getTestClient = () => {
  return createClient({
    url: DB_CONFIG.url,
    authToken: DB_CONFIG.authToken,
  });
};

export type Database = typeof db;
