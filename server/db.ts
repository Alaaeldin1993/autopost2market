import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  admins, InsertAdmin, Admin,
  packages, InsertPackage, Package,
  groups, InsertGroup, Group,
  posts, InsertPost, Post,
  postGroups, InsertPostGroup, PostGroup,
  payments, InsertPayment, Payment,
  settings, InsertSetting, Setting,
  activityLogs, InsertActivityLog, ActivityLog,
  rssFeeds, InsertRssFeed, RssFeed
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER FUNCTIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(searchTerm?: string) {
  const db = await getDb();
  if (!db) return [];

  if (searchTerm) {
    return await db.select().from(users)
      .where(
        or(
          like(users.email, `%${searchTerm}%`),
          like(users.name, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(users.createdAt));
  }

  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(users).set(data).where(eq(users.id, id));
  return getUserById(id);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(users).where(eq(users.id, id));
  return true;
}

// ============= ADMIN FUNCTIONS =============

export async function createAdmin(admin: InsertAdmin) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(admins).values(admin);
  return Number(result[0].insertId);
}

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAdminById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= PACKAGE FUNCTIONS =============

export async function createPackage(pkg: InsertPackage) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(packages).values(pkg);
  return Number(result[0].insertId);
}

export async function getAllPackages(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];

  if (activeOnly) {
    return await db.select().from(packages).where(eq(packages.isActive, 1));
  }

  return await db.select().from(packages);
}

export async function getPackageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePackage(id: number, data: Partial<InsertPackage>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(packages).set(data).where(eq(packages.id, id));
  return getPackageById(id);
}

export async function deletePackage(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(packages).where(eq(packages.id, id));
  return true;
}

// ============= GROUP FUNCTIONS =============

export async function createGroup(group: InsertGroup) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(groups).values(group);
  return Number(result[0].insertId);
}

export async function getUserGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(groups)
    .where(eq(groups.userId, userId))
    .orderBy(desc(groups.createdAt));
}

export async function getGroupById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateGroup(id: number, data: Partial<InsertGroup>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(groups).set(data).where(eq(groups.id, id));
  return getGroupById(id);
}

export async function deleteGroup(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(groups).where(eq(groups.id, id));
  return true;
}

// ============= POST FUNCTIONS =============

export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(posts).values(post);
  return Number(result[0].insertId);
}

export async function getUserPosts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePost(id: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(posts).set(data).where(eq(posts.id, id));
  return getPostById(id);
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(posts).where(eq(posts.id, id));
  return true;
}

export async function getScheduledPosts() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db.select().from(posts)
    .where(
      and(
        eq(posts.status, "scheduled"),
        sql`${posts.scheduledAt} <= ${now}`
      )
    );
}

// ============= POST GROUP FUNCTIONS =============

export async function createPostGroup(postGroup: InsertPostGroup) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(postGroups).values(postGroup);
  return Number(result[0].insertId);
}

export async function getPostGroupsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(postGroups).where(eq(postGroups.postId, postId));
}

export async function updatePostGroup(id: number, data: Partial<InsertPostGroup>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(postGroups).set(data).where(eq(postGroups.id, id));
  return true;
}

// ============= PAYMENT FUNCTIONS =============

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(payments).values(payment);
  return Number(result[0].insertId);
}

export async function getAllPayments() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(payments).set(data).where(eq(payments.id, id));
  return getPaymentById(id);
}

// ============= SETTINGS FUNCTIONS =============

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(settings).where(eq(settings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(settings);
}

export async function upsertSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(settings)
    .values({ settingKey: key, settingValue: value })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });

  return getSetting(key);
}

// ============= ACTIVITY LOG FUNCTIONS =============

export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(activityLogs).values(log);
  return Number(result[0].insertId);
}

export async function getActivityLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function getUserActivityLogs(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

// ============= RSS FEED FUNCTIONS =============

export async function createRssFeed(feed: InsertRssFeed) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(rssFeeds).values(feed);
  return Number(result[0].insertId);
}

export async function getUserRssFeeds(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rssFeeds)
    .where(eq(rssFeeds.userId, userId))
    .orderBy(desc(rssFeeds.createdAt));
}

export async function updateRssFeed(id: number, data: Partial<InsertRssFeed>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(rssFeeds).set(data).where(eq(rssFeeds.id, id));
  return true;
}

export async function deleteRssFeed(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(rssFeeds).where(eq(rssFeeds.id, id));
  return true;
}

// ============= STATISTICS FUNCTIONS =============

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [activeSubscriptionsResult] = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.subscriptionStatus, "active"));
  
  const [totalRevenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0)` })
    .from(payments)
    .where(eq(payments.status, "completed"));

  const [monthlyRevenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        sql`MONTH(createdAt) = MONTH(CURRENT_DATE())`,
        sql`YEAR(createdAt) = YEAR(CURRENT_DATE())`
      )
    );

  return {
    totalUsers: totalUsersResult?.count || 0,
    activeSubscriptions: activeSubscriptionsResult?.count || 0,
    totalRevenue: totalRevenueResult?.total || 0,
    monthlyRevenue: monthlyRevenueResult?.total || 0,
  };
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [totalGroupsResult] = await db.select({ count: sql<number>`count(*)` })
    .from(groups)
    .where(eq(groups.userId, userId));

  const [totalPostsResult] = await db.select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.userId, userId));

  const [completedPostsResult] = await db.select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(
      and(
        eq(posts.userId, userId),
        eq(posts.status, "completed")
      )
    );

  return {
    totalGroups: totalGroupsResult?.count || 0,
    totalPosts: totalPostsResult?.count || 0,
    completedPosts: completedPostsResult?.count || 0,
  };
}
