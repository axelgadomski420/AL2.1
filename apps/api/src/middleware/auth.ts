import { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { AUTH_CONFIG } from '../config/auth';
import { db } from '../config/database';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createError } from './errorHandler';
import { ERROR_CODES, ERROR_MESSAGES } from '@al/shared';

interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthContext {
  userId: string;
  email: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// JWT verification middleware
export const jwtAuth = async (c: Context, next: Next) => {
  try {
    // Get token from header or cookies
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : getCookie(c, 'token');

    if (!token) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
        401
      );
    }

    // Verify JWT
    const payload = await verify(token, AUTH_CONFIG.JWT_SECRET, {
      issuer: AUTH_CONFIG.JWT_ISSUER,
      audience: AUTH_CONFIG.JWT_AUDIENCE,
    });

    if (!payload || !payload.sub) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
        401
      );
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      throw createError(
        ERROR_CODES.AUTH_USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.AUTH_USER_NOT_FOUND],
        401
      );
    }

    // Set user context
    c.set('user', {
      userId: user.id,
      email: user.email,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    } as AuthContext);

    await next();
  } catch (err) {
    if (err instanceof Error && err.message.includes('jwt expired')) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
        ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_EXPIRED],
        401
      );
    }
    throw err;
  }
};

// Optional JWT authentication (for routes that work with or without auth)
export const optionalJwtAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : getCookie(c, 'token');

    if (!token) {
      // No token, continue without user context
      c.set('user', null);
      await next();
      return;
    }

    const payload = await verify(token, AUTH_CONFIG.JWT_SECRET, {
      issuer: AUTH_CONFIG.JWT_ISSUER,
      audience: AUTH_CONFIG.JWT_AUDIENCE,
    });

    if (!payload || !payload.sub) {
      c.set('user', null);
      await next();
      return;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      c.set('user', null);
      await next();
      return;
    }

    c.set('user', {
      userId: user.id,
      email: user.email,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    } as AuthContext);

    await next();
  } catch (err) {
    c.set('user', null);
    await next();
  }
};

// Session-based authentication (alternative to JWT)
export const sessionAuth = async (c: Context, next: Next) => {
  const sessionToken = getCookie(c, AUTH_CONFIG.SESSION_SECRET);

  if (!sessionToken) {
    throw createError(
      ERROR_CODES.AUTH_TOKEN_INVALID,
      ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
      401
    );
  }

  // In a real implementation, you would verify the session token against a session store
  // For now, we'll use JWT for sessions as well
  try {
    const payload = await verify(sessionToken, AUTH_CONFIG.JWT_SECRET);
    
    if (!payload || !payload.sub) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
        401
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      throw createError(
        ERROR_CODES.AUTH_USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.AUTH_USER_NOT_FOUND],
        401
      );
    }

    c.set('user', {
      userId: user.id,
      email: user.email,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    } as AuthContext);

    await next();
  } catch (err) {
    if (err instanceof Error && err.message.includes('jwt expired')) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
        ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_EXPIRED],
        401
      );
    }
    throw err;
  }
};

// Get authenticated user from context
export const getAuthUser = (c: Context): AuthContext => {
  const user = c.get('user');
  
  if (!user) {
    throw createError(
      ERROR_CODES.AUTH_TOKEN_INVALID,
      ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
      401
    );
  }
  
  return user as AuthContext;
};

// Get authenticated user ID from context
export const getAuthUserId = (c: Context): string => {
  return getAuthUser(c).userId;
};

// Check if user is authenticated
export const isAuthenticated = (c: Context): boolean => {
  const user = c.get('user');
  return user !== null && user !== undefined;
};

// Generate JWT token
export const generateToken = (userId: string, email: string): string => {
  const payload = {
    sub: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
  };

  return c.jwtSign(payload, AUTH_CONFIG.JWT_SECRET, {
    issuer: AUTH_CONFIG.JWT_ISSUER,
    audience: AUTH_CONFIG.JWT_AUDIENCE,
    expiresIn: AUTH_CONFIG.JWT_EXPIRY,
  });
};

// Helper to add auth cookies to response
export const addAuthCookies = (c: Context, token: string, rememberMe: boolean = false) => {
  const expiry = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days or 24 hours
  
  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: APP_CONFIG.IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: expiry,
    path: '/',
  });

  // Also set for API requests
  setCookie(c, 'al_token', token, {
    httpOnly: false, // Accessible via JavaScript for API requests
    secure: APP_CONFIG.IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: expiry,
    path: '/',
  });
};

// Helper to clear auth cookies
export const clearAuthCookies = (c: Context) => {
  deleteCookie(c, 'token');
  deleteCookie(c, 'al_token');
  deleteCookie(c, 'refresh_token');
  deleteCookie(c, 'al_refresh_token');
};

// Import APP_CONFIG from app config
import { APP_CONFIG } from '../config/app';
