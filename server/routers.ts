import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { paypalRouter } from "./paypal";
import * as db from "./db";
import { generateToken, hashPassword, verifyPassword, extractTokenFromHeader, verifyToken } from "./auth-utils";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Custom procedure for admin JWT authentication (separate from Manus OAuth)
const adminJWTProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin authentication required' });
  }

  return next({
    ctx: {
      ...ctx,
      admin: ctx.admin,
    },
  });
});

export const appRouter = router({
  system: systemRouter,
  paypal: paypalRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Admin authentication (separate from Manus OAuth)
  admin: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const admin = await db.getAdminByEmail(input.email);
        if (!admin) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }

        const isValid = await verifyPassword(input.password, admin.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }

        const token = await generateToken({
          adminId: admin.id,
          email: admin.email,
          type: 'admin',
        });

        await db.createActivityLog({
          adminId: admin.id,
          action: 'admin_login',
          description: `Admin ${admin.email} logged in`,
          ipAddress: null,
        });

        return {
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          },
        };
      }),

    dashboard: adminJWTProcedure.query(async () => {
      const stats = await db.getDashboardStats();
      const recentActivity = await db.getActivityLogs(10);
      
      return {
        stats,
        recentActivity,
      };
    }),

    // User management
    users: router({
      list: adminJWTProcedure
        .input(z.object({ search: z.string().optional() }).optional())
        .query(async ({ input }) => {
          return await db.getAllUsers(input?.search);
        }),

      get: adminJWTProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const user = await db.getUserById(input.id);
          if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
          }
          return user;
        }),

      update: adminJWTProcedure
        .input(z.object({
          id: z.number(),
          subscriptionStatus: z.enum(['trial', 'active', 'expired', 'suspended', 'lifetime']).optional(),
          subscriptionPackageId: z.number().nullable().optional(),
          subscriptionExpiresAt: z.date().nullable().optional(),
          trialEndsAt: z.date().nullable().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const { id, ...data } = input;
          const user = await db.updateUser(id, data);
          
          await db.createActivityLog({
            adminId: (ctx as any).admin.id,
            userId: id,
            action: 'user_updated',
            description: `Admin updated user ${id}`,
            ipAddress: null,
          });

          return user;
        }),

      delete: adminJWTProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await db.deleteUser(input.id);
          
          await db.createActivityLog({
            adminId: (ctx as any).admin.id,
            action: 'user_deleted',
            description: `Admin deleted user ${input.id}`,
            ipAddress: null,
          });

          return { success: true };
        }),

      giveAccess: adminJWTProcedure
        .input(z.object({
          userId: z.number(),
          accessType: z.enum(['trial', 'lifetime', 'custom']),
          days: z.number().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const user = await db.getUserById(input.userId);
          if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
          }

          let updateData: any = {};

          if (input.accessType === 'lifetime') {
            updateData.subscriptionStatus = 'lifetime';
            updateData.subscriptionExpiresAt = null;
          } else if (input.accessType === 'trial' && input.days) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + input.days);
            updateData.subscriptionStatus = 'trial';
            updateData.trialEndsAt = expiresAt;
          } else if (input.accessType === 'custom' && input.days) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + input.days);
            updateData.subscriptionStatus = 'active';
            updateData.subscriptionExpiresAt = expiresAt;
          }

          await db.updateUser(input.userId, updateData);

          await db.createActivityLog({
            adminId: (ctx as any).admin.id,
            userId: input.userId,
            action: 'access_granted',
            description: `Admin granted ${input.accessType} access to user ${input.userId}`,
            ipAddress: null,
          });

          return { success: true };
        }),
    }),

    // Package management
    packages: router({
      list: adminJWTProcedure.query(async () => {
        return await db.getAllPackages();
      }),

      create: adminJWTProcedure
        .input(z.object({
          name: z.string(),
          price: z.string(),
          durationDays: z.number(),
          maxGroups: z.number(),
          maxPostsPerDay: z.number(),
          features: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const id = await db.createPackage(input);
          
          await db.createActivityLog({
            adminId: (ctx as any).admin.id,
            action: 'package_created',
            description: `Admin created package: ${input.name}`,
            ipAddress: null,
          });

          return { id };
        }),

      update: adminJWTProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          price: z.string().optional(),
          durationDays: z.number().optional(),
          maxGroups: z.number().optional(),
          maxPostsPerDay: z.number().optional(),
          features: z.string().optional(),
          isActive: z.number().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const { id, ...data } = input;
          await db.updatePackage(id, data);
          
          await db.createActivityLog({
            adminId: (ctx as any).admin.id,
            action: 'package_updated',
            description: `Admin updated package ${id}`,
            ipAddress: null,
          });

          return { success: true };
        }),

      delete: adminJWTProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await db.deletePackage(input.id);
          
          await db.createActivityLog({
            adminId: (ctx as any).admin.id,
            action: 'package_deleted',
            description: `Admin deleted package ${input.id}`,
            ipAddress: null,
          });

          return { success: true };
        }),
    }),

    // Payment management
    payments: router({
      list: adminJWTProcedure.query(async () => {
        return await db.getAllPayments();
      }),

      record: adminJWTProcedure
        .input(z.object({
          userId: z.number(),
          packageId: z.number().optional(),
          amount: z.string(),
          transactionId: z.string().optional(),
          status: z.enum(['pending', 'completed', 'failed', 'refunded']),
        }))
        .mutation(async ({ input, ctx }) => {
          const id = await db.createPayment(input);
          
          await db.createActivityLog({
            adminId: (ctx as any).admin.id,
            action: 'payment_recorded',
            description: `Admin recorded payment for user ${input.userId}`,
            ipAddress: null,
          });

          return { id };
        }),
    }),

    // Settings management
    settings: router({
      list: adminJWTProcedure.query(async () => {
        return await db.getAllSettings();
      }),

      update: adminJWTProcedure
        .input(z.object({
          settings: z.array(z.object({
            key: z.string(),
            value: z.string(),
          })),
        }))
        .mutation(async ({ input, ctx }) => {
          for (const setting of input.settings) {
            await db.upsertSetting(setting.key, setting.value);
          }
          
          await db.createActivityLog({
            adminId: (ctx as any).admin.id,
            action: 'settings_updated',
            description: 'Admin updated system settings',
            ipAddress: null,
          });

          return { success: true };
        }),
    }),

    // Activity logs
    logs: router({
      list: adminJWTProcedure
        .input(z.object({ limit: z.number().optional() }).optional())
        .query(async ({ input }) => {
          return await db.getActivityLogs(input?.limit || 100);
        }),
    }),
  }),

  // User groups management
  groups: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserGroups(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        groupId: z.string(),
        groupName: z.string(),
        groupUrl: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createGroup({
          userId: ctx.user.id,
          ...input,
        });

        await db.createActivityLog({
          userId: ctx.user.id,
          action: 'group_created',
          description: `User added group: ${input.groupName}`,
          ipAddress: null,
        });

        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        groupName: z.string().optional(),
        groupUrl: z.string().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const group = await db.getGroupById(id);
        
        if (!group || group.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await db.updateGroup(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const group = await db.getGroupById(input.id);
        
        if (!group || group.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await db.deleteGroup(input.id);

        await db.createActivityLog({
          userId: ctx.user.id,
          action: 'group_deleted',
          description: `User deleted group ${input.id}`,
          ipAddress: null,
        });

        return { success: true };
      }),
  }),

  // User posts management
  posts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPosts(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const post = await db.getPostById(input.id);
        
        if (!post || post.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return post;
      }),

    create: protectedProcedure
      .input(z.object({
        content: z.string(),
        spintaxContent: z.string().optional(),
        mediaUrls: z.string().optional(),
        scheduledAt: z.date().optional(),
        groupsToPost: z.string(),
        delayBetweenPosts: z.number().optional(),
        scheduleType: z.enum(['once', 'daily', 'weekly', 'custom']).optional(),
        scheduleConfig: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createPost({
          userId: ctx.user.id,
          ...input,
          status: input.scheduledAt ? 'scheduled' : 'draft',
        });

        await db.createActivityLog({
          userId: ctx.user.id,
          action: 'post_created',
          description: 'User created a new post',
          ipAddress: null,
        });

        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().optional(),
        spintaxContent: z.string().optional(),
        mediaUrls: z.string().optional(),
        scheduledAt: z.date().optional(),
        status: z.enum(['draft', 'scheduled', 'posting', 'completed', 'failed']).optional(),
        groupsToPost: z.string().optional(),
        delayBetweenPosts: z.number().optional(),
        scheduleType: z.enum(['once', 'daily', 'weekly', 'custom']).optional(),
        scheduleConfig: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const post = await db.getPostById(id);
        
        if (!post || post.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await db.updatePost(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const post = await db.getPostById(input.id);
        
        if (!post || post.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await db.deletePost(input.id);

        await db.createActivityLog({
          userId: ctx.user.id,
          action: 'post_deleted',
          description: `User deleted post ${input.id}`,
          ipAddress: null,
        });

        return { success: true };
      }),
  }),

  // User statistics
  stats: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStats(ctx.user.id);
    }),
  }),

  // Public packages (for landing page)
  publicPackages: router({
    list: publicProcedure.query(async () => {
      return await db.getAllPackages(true);
    }),
  }),
});

export type AppRouter = typeof appRouter;
