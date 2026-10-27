import { Hono } from 'hono';
import { jwtAuth, optionalJwtAuth, generateToken, addAuthCookies, clearAuthCookies } from '../middleware/auth';
import { db } from '../config/database';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { AUTH_CONFIG } from '../config/auth';
import { createError } from '../middleware/errorHandler';
import { ERROR_CODES, ERROR_MESSAGES, LoginSchema, RegisterSchema, type User, type AuthResponse, type APIResponse } from '@al/shared';
import { generateId, now } from '@al/shared';

const authRouter = new Hono();

// Register a new user
authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        validation.error.errors[0].message,
        400,
        { field: validation.error.errors[0].path[0] }
      );
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw createError(
        ERROR_CODES.DB_DUPLICATE,
        'Użytkownik z tym adresem e-mail już istnieje',
        409
      );
    }

    // Hash password
    const passwordHash = await hash(password, AUTH_CONFIG.PASSWORD_HASH_ROUNDS);

    // Create user
    const userId = generateId();
    const nowDate = now();

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name,
      emailVerified: false,
      createdAt: nowDate,
      updatedAt: nowDate,
    });

    // Get the created user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw createError(
        ERROR_CODES.DB_QUERY_ERROR,
        ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
        500
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Create session
    await db.insert(sessions).values({
      id: generateId(),
      userId: user.id,
      token,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
      expiresAt: new Date(Date.now() + AUTH_CONFIG.SESSION_MAX_AGE * 1000),
      createdAt: nowDate,
    });

    // Prepare response
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };

    // Set cookies
    addAuthCookies(c, token, false);

    return c.json<APIResponse<AuthResponse>>({
      success: true,
      data: response,
      message: 'Rejestracja powiodła się',
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('duplicate')) {
      throw createError(
        ERROR_CODES.DB_DUPLICATE,
        'Użytkownik z tym adresem e-mail już istnieje',
        409
      );
    }
    throw err;
  }
});

// Login
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        validation.error.errors[0].message,
        400,
        { field: validation.error.errors[0].path[0] }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Return generic error to prevent email enumeration
      throw createError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        401
      );
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw createError(
        ERROR_CODES.AUTH_ACCOUNT_LOCKED,
        ERROR_MESSAGES[ERROR_CODES.AUTH_ACCOUNT_LOCKED],
        403
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await db
        .update(users)
        .set({
          failedLoginAttempts: user.failedLoginAttempts + 1,
          lastLoginAt: now(),
          updatedAt: now(),
        })
        .where(eq(users.id, user.id));

      // Lock account if too many failed attempts
      if (user.failedLoginAttempts + 1 >= AUTH_CONFIG.MAX_FAILED_LOGINS) {
        const lockoutUntil = new Date(Date.now() + AUTH_CONFIG.LOCKOUT_DURATION * 1000);
        await db
          .update(users)
          .set({
            lockedUntil: lockoutUntil,
            updatedAt: now(),
          })
          .where(eq(users.id, user.id));

        throw createError(
          ERROR_CODES.AUTH_ACCOUNT_LOCKED,
          ERROR_MESSAGES[ERROR_CODES.AUTH_ACCOUNT_LOCKED],
          403
        );
      }

      // Return generic error to prevent email enumeration
      throw createError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        401
      );
    }

    // Reset failed login attempts on successful login
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lastLoginAt: now(),
        updatedAt: now(),
      })
      .where(eq(users.id, user.id));

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Create session
    await db.insert(sessions).values({
      id: generateId(),
      userId: user.id,
      token,
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
      expiresAt: new Date(Date.now() + AUTH_CONFIG.SESSION_MAX_AGE * 1000),
      createdAt: now(),
    });

    // Get updated user
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!updatedUser) {
      throw createError(
        ERROR_CODES.DB_QUERY_ERROR,
        ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
        500
      );
    }

    // Prepare response
    const response: AuthResponse = {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || undefined,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      token,
    };

    // Set cookies
    const rememberMe = body.rememberMe === true;
    addAuthCookies(c, token, rememberMe);

    return c.json<APIResponse<AuthResponse>>({
      success: true,
      data: response,
      message: 'Zalogowano pomyślnie',
    });
  } catch (err) {
    throw err;
  }
});

// Logout
authRouter.post('/logout', jwtAuth, async (c) => {
  try {
    const user = c.get('user') as { userId: string };

    // Delete all sessions for this user
    await db.delete(sessions).where(eq(sessions.userId, user.userId));

    // Clear cookies
    clearAuthCookies(c);

    return c.json<APIResponse<null>>({
      success: true,
      message: 'Wylogowano pomyślnie',
    });
  } catch (err) {
    throw err;
  }
});

// Get current user (me)
authRouter.get('/me', jwtAuth, async (c) => {
  try {
    const user = c.get('user') as { user: User };

    return c.json<APIResponse<User>>({
      success: true,
      data: user.user,
    });
  } catch (err) {
    throw err;
  }
});

// Refresh token
authRouter.post('/refresh', async (c) => {
  try {
    const refreshToken = c.req.header('Authorization')?.slice(7) || getCookie(c, 'refresh_token');

    if (!refreshToken) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
        401
      );
    }

    // Verify refresh token
    const payload = await verify(refreshToken, AUTH_CONFIG.JWT_SECRET, {
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

    // Get user
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

    // Generate new token
    const token = generateToken(user.id, user.email);

    // Update session
    await db
      .update(sessions)
      .set({
        token,
        expiresAt: new Date(Date.now() + AUTH_CONFIG.SESSION_MAX_AGE * 1000),
        updatedAt: now(),
      })
      .where(eq(sessions.userId, user.id));

    // Set new cookie
    addAuthCookies(c, token, false);

    return c.json<APIResponse<{ token: string }>>({
      success: true,
      data: { token },
      message: 'Token odświeżony pomyślnie',
    });
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
});

// Forgot password
authRouter.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Adres e-mail jest wymagany',
        400
      );
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Don't reveal if user exists or not
      return c.json<APIResponse<null>>({
        success: true,
        message: 'Jeśli użytkownik istnieje, link resetowania hasła został wysłany na podany adres e-mail',
      });
    }

    // Generate reset token
    const resetToken = generateId();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetTokenExpires: resetTokenExpires,
        updatedAt: now(),
      })
      .where(eq(users.id, user.id));

    // In a real implementation, you would send an email here
    // For now, we'll just return success

    return c.json<APIResponse<null>>({
      success: true,
      message: 'Link resetowania hasła został wysłany na podany adres e-mail',
    });
  } catch (err) {
    throw err;
  }
});

// Reset password
authRouter.post('/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Token i nowe hasło są wymagane',
        400
      );
    }

    if (newPassword.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        `Hasło musi mieć co najmniej ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} znaków`,
        400
      );
    }

    // Find user with reset token
    const user = await db.query.users.findFirst({
      where: eq(users.passwordResetToken, token),
    });

    if (!user) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        'Nieprawidłowy lub wygasły token resetowania hasła',
        401
      );
    }

    // Check if token is expired
    if (user.passwordResetTokenExpires && new Date(user.passwordResetTokenExpires) < new Date()) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
        'Token resetowania hasła wygasł',
        401
      );
    }

    // Hash new password
    const passwordHash = await hash(newPassword, AUTH_CONFIG.PASSWORD_HASH_ROUNDS);

    // Update user
    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: now(),
      })
      .where(eq(users.id, user.id));

    return c.json<APIResponse<null>>({
      success: true,
      message: 'Hasło zostało zresetowane pomyślnie',
    });
  } catch (err) {
    throw err;
  }
});

// Change password
authRouter.post('/change-password', jwtAuth, async (c) => {
  try {
    const user = c.get('user') as { userId: string };
    const { currentPassword, newPassword, confirmPassword } = await c.req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Wszystkie pola są wymagane',
        400
      );
    }

    if (newPassword !== confirmPassword) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Nowe hasła nie są identyczne',
        400
      );
    }

    if (newPassword.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        `Hasło musi mieć co najmniej ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} znaków`,
        400
      );
    }

    // Get user
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!dbUser) {
      throw createError(
        ERROR_CODES.AUTH_USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.AUTH_USER_NOT_FOUND],
        401
      );
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, dbUser.passwordHash);

    if (!isPasswordValid) {
      throw createError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'Obecne hasło jest nieprawidłowe',
        401
      );
    }

    // Hash new password
    const passwordHash = await hash(newPassword, AUTH_CONFIG.PASSWORD_HASH_ROUNDS);

    // Update user
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: now(),
      })
      .where(eq(users.id, user.userId));

    return c.json<APIResponse<null>>({
      success: true,
      message: 'Hasło zostało zmienione pomyślnie',
    });
  } catch (err) {
    throw err;
  }
});

// Verify email
authRouter.post('/verify-email', async (c) => {
  try {
    const { token } = await c.req.json();

    if (!token) {
      throw createError(
        ERROR_CODES.VALIDATION_ERROR,
        'Token jest wymagany',
        400
      );
    }

    // Find user with verification token
    const user = await db.query.users.findFirst({
      where: eq(users.emailVerificationToken, token),
    });

    if (!user) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        'Nieprawidłowy token weryfikacyjny',
        401
      );
    }

    // Check if token is expired
    if (user.emailVerificationTokenExpires && new Date(user.emailVerificationTokenExpires) < new Date()) {
      throw createError(
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
        'Token weryfikacyjny wygasł',
        401
      );
    }

    // Update user
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
        updatedAt: now(),
      })
      .where(eq(users.id, user.id));

    return c.json<APIResponse<null>>({
      success: true,
      message: 'Adres e-mail został zweryfikowany pomyślnie',
    });
  } catch (err) {
    throw err;
  }
});

// Get auth cookies (for PWA)
authRouter.get('/cookies', optionalJwtAuth, (c) => {
  const token = c.req.header('Authorization')?.slice(7) || c.req.header('cookie')?.split('=')[1];
  
  if (token) {
    return c.json<APIResponse<{ hasToken: boolean }>>({
      success: true,
      data: { hasToken: true },
    });
  }

  return c.json<APIResponse<{ hasToken: boolean }>>({
    success: true,
    data: { hasToken: false },
  });
});

// Helper to get cookie
declare module 'hono' {
  interface ContextVariableMap {
    user: {
      userId: string;
      email: string;
      user?: User;
    } | null;
  }
}

export default authRouter;
