import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { ERROR_CODES, ERROR_MESSAGES } from '@al/shared';
import { APP_CONFIG } from '../config/app';

interface AppError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

export const errorHandler = (err: Error, c: Context) => {
  // Log the error in development
  if (APP_CONFIG.IS_DEVELOPMENT) {
    console.error('Error:', err);
  }

  // Handle HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: err.res.status.toString(),
          message: err.message,
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse,
      err.status
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: firstError.message,
          details: {
            field: firstError.path.join('.'),
            expected: firstError.expected,
            received: firstError.received,
          },
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse,
      400
    );
  }

  // Handle custom application errors
  if ('code' in err && 'status' in err) {
    const appError = err as AppError;
    return c.json(
      {
        success: false,
        error: {
          code: appError.code || ERROR_CODES.INTERNAL_ERROR,
          message: appError.message,
          details: appError.details,
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse,
      appError.status || 500
    );
  }

  // Handle database errors
  if (err.message.includes('SQLITE') || err.message.includes('database')) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DB_QUERY_ERROR,
          message: ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse,
      500
    );
  }

  // Handle rate limiting errors
  if (err.message.includes('rate limit') || err.message.includes('too many requests')) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED],
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse,
      429
    );
  }

  // Handle authentication errors
  if (err.message.includes('jwt') || err.message.includes('token') || err.message.includes('authentication')) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
          message: ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse,
      401
    );
  }

  // Handle authorization errors
  if (err.message.includes('permission') || err.message.includes('authorization') || err.message.includes('forbidden')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'AUTH_007',
          message: 'Brak uprawnień do wykonania tej akcji',
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse,
      403
    );
  }

  // Handle not found errors
  if (err.message.includes('not found') || err.message.includes('404')) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DB_NOT_FOUND,
          message: ERROR_MESSAGES[ERROR_CODES.DB_NOT_FOUND],
          timestamp: new Date().toISOString(),
        },
      } as ErrorResponse,
      404
    );
  }

  // Default error handler
  return c.json(
    {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: APP_CONFIG.IS_DEVELOPMENT ? err.message : ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
        timestamp: new Date().toISOString(),
      },
    } as ErrorResponse,
    500
  );
};

// Create custom error
export const createError = (
  code: string,
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): AppError => {
  const error = new Error(message) as AppError;
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
};

// Throw custom error
export const throwError = (
  code: string,
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): never => {
  throw createError(code, message, status, details);
};
