import { Hono } from 'hono';
import { jwtAuth, getAuthUserId } from '../middleware/auth';
import { db } from '../config/database';
import { users, userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateId, now } from '@al/shared';
import { createError } from '../middleware/errorHandler';
import { ERROR_CODES, ERROR_MESSAGES, type User, type UserProfile, type APIResponse } from '@al/shared';

const userRouter = new Hono();

// Get current user profile
userRouter.get('/me', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw createError(
        ERROR_CODES.AUTH_USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.AUTH_USER_NOT_FOUND],
        404
      );
    }

    // Get user profile
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    return c.json<APIResponse<User & { profile?: UserProfile }>>({
      success: true,
      data: {
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
        lockedUntil: user.lockedUntil ? new Date(user.lockedUntil) : undefined,
        profile: profile ? {
          ...profile,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt),
        } : undefined,
      },
    });
  } catch (err) {
    throw err;
  }
});

// Update user profile
userRouter.patch('/me', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const body = await c.req.json();

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw createError(
        ERROR_CODES.AUTH_USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.AUTH_USER_NOT_FOUND],
        404
      );
    }

    // Update user
    if (body.name !== undefined) {
      await db
        .update(users)
        .set({
          name: body.name,
          updatedAt: now(),
        })
        .where(eq(users.id, userId));
    }

    // Update or create profile
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (profile) {
      await db
        .update(userProfiles)
        .set({
          displayName: body.displayName || body.name || profile.displayName,
          bio: body.bio,
          avatar: body.avatar,
          preferences: body.preferences || profile.preferences,
          updatedAt: now(),
        })
        .where(eq(userProfiles.id, profile.id));
    } else {
      await db.insert(userProfiles).values({
        id: generateId(),
        userId,
        displayName: body.displayName || body.name || user.name || user.email,
        bio: body.bio,
        avatar: body.avatar,
        preferences: body.preferences || {
          theme: 'dark',
          language: 'pl',
          modelProfile: 'fast',
          autoSave: true,
          notifications: true,
        },
        createdAt: now(),
        updatedAt: now(),
      });
    }

    // Get updated user and profile
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const updatedProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!updatedUser) {
      throw createError(
        ERROR_CODES.DB_QUERY_ERROR,
        ERROR_MESSAGES[ERROR_CODES.DB_QUERY_ERROR],
        500
      );
    }

    return c.json<APIResponse<User & { profile?: UserProfile }>>({
      success: true,
      data: {
        ...updatedUser,
        createdAt: new Date(updatedUser.createdAt),
        updatedAt: new Date(updatedUser.updatedAt),
        lastLoginAt: updatedUser.lastLoginAt ? new Date(updatedUser.lastLoginAt) : undefined,
        lockedUntil: updatedUser.lockedUntil ? new Date(updatedUser.lockedUntil) : undefined,
        profile: updatedProfile ? {
          ...updatedProfile,
          createdAt: new Date(updatedProfile.createdAt),
          updatedAt: new Date(updatedProfile.updatedAt),
        } : undefined,
      },
      message: 'Profil został zaktualizowany',
    });
  } catch (err) {
    throw err;
  }
});

// Get user preferences
userRouter.get('/me/preferences', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);

    // Get user profile
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!profile) {
      // Return default preferences
      return c.json<APIResponse<UserProfile['preferences']>>({
        success: true,
        data: {
          theme: 'dark',
          language: 'pl',
          modelProfile: 'fast',
          autoSave: true,
          notifications: true,
        },
      });
    }

    return c.json<APIResponse<UserProfile['preferences']>>({
      success: true,
      data: profile.preferences,
    });
  } catch (err) {
    throw err;
  }
});

// Update user preferences
userRouter.patch('/me/preferences', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);
    const body = await c.req.json();

    // Get user profile
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!profile) {
      // Create profile with new preferences
      await db.insert(userProfiles).values({
        id: generateId(),
        userId,
        displayName: userId,
        preferences: body,
        createdAt: now(),
        updatedAt: now(),
      });
    } else {
      // Update existing preferences
      await db
        .update(userProfiles)
        .set({
          preferences: {
            ...profile.preferences,
            ...body,
          },
          updatedAt: now(),
        })
        .where(eq(userProfiles.id, profile.id));
    }

    return c.json<APIResponse<UserProfile['preferences']>>({
      success: true,
      data: body,
      message: 'Preferencje zostały zaktualizowane',
    });
  } catch (err) {
    throw err;
  }
});

// Delete user account
userRouter.delete('/me', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);

    // Delete user (cascade will delete related records)
    await db.delete(users).where(eq(users.id, userId));

    return c.json<APIResponse<null>>({
      success: true,
      message: 'Konto zostało usunięte',
    });
  } catch (err) {
    throw err;
  }
});

// Get user statistics
userRouter.get('/me/stats', jwtAuth, async (c) => {
  try {
    const userId = getAuthUserId(c);

    // Get counts
    const [conversationCount, messageCount, projectCount, taskCount] = await Promise.all([
      db.select({ count: users.id.count() }).from(users).where(eq(users.id, userId)),
      // These would normally query the respective tables
      // For now, return mock counts
      Promise.resolve([{ count: 0 }]),
      Promise.resolve([{ count: 0 }]),
      Promise.resolve([{ count: 0 }]),
    ]);

    return c.json<APIResponse<{
      conversationCount: number;
      messageCount: number;
      projectCount: number;
      taskCount: number;
      storageUsed: number;
    }>>({
      success: true,
      data: {
        conversationCount: 0,
        messageCount: 0,
        projectCount: 0,
        taskCount: 0,
        storageUsed: 0,
      },
    });
  } catch (err) {
    throw err;
  }
});

export default userRouter;
