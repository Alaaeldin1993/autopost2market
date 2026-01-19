import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["trial", "active", "expired", "suspended", "lifetime"]).default("trial").notNull(),
  subscriptionPackageId: int("subscriptionPackageId"),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Admins table for separate admin authentication
export const admins = mysqlTable("admins", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// Subscription packages
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: varchar("price", { length: 20 }).notNull(), // Store as string to preserve decimal precision
  durationDays: int("durationDays").notNull(),
  maxGroups: int("maxGroups").notNull(),
  maxPostsPerDay: int("maxPostsPerDay").notNull(),
  features: text("features"), // JSON string
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

// Facebook groups managed by users
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId: varchar("groupId", { length: 255 }).notNull(), // Facebook group ID
  groupName: varchar("groupName", { length: 500 }).notNull(),
  groupUrl: text("groupUrl").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

// Posts created by users
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  spintaxContent: text("spintaxContent"), // Original spintax template
  mediaUrls: text("mediaUrls"), // JSON array of media URLs
  scheduledAt: timestamp("scheduledAt"),
  status: mysqlEnum("status", ["draft", "scheduled", "posting", "completed", "failed"]).default("draft").notNull(),
  groupsToPost: text("groupsToPost"), // JSON array of group IDs
  delayBetweenPosts: int("delayBetweenPosts").default(60), // Seconds between posts
  scheduleType: mysqlEnum("scheduleType", ["once", "daily", "weekly", "custom"]).default("once"),
  scheduleConfig: text("scheduleConfig"), // JSON for custom schedule configuration
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// Junction table for posts and groups with status tracking
export const postGroups = mysqlTable("postGroups", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  groupId: int("groupId").notNull().references(() => groups.id, { onDelete: 'cascade' }),
  status: mysqlEnum("status", ["pending", "posted", "failed"]).default("pending").notNull(),
  postedAt: timestamp("postedAt"),
  errorMessage: text("errorMessage"),
});

export type PostGroup = typeof postGroups.$inferSelect;
export type InsertPostGroup = typeof postGroups.$inferInsert;

// Payment records
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  packageId: int("packageId").references(() => packages.id, { onDelete: 'set null' }),
  amount: varchar("amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  paymentMethod: varchar("paymentMethod", { length: 50 }).default("paypal").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// System settings
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 255 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// Activity logs for audit trail
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: 'set null' }),
  adminId: int("adminId").references(() => admins.id, { onDelete: 'set null' }),
  action: varchar("action", { length: 255 }).notNull(),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// RSS feeds for content automation
export const rssFeeds = mysqlTable("rssFeeds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: 'cascade' }),
  feedUrl: text("feedUrl").notNull(),
  feedName: varchar("feedName", { length: 255 }).notNull(),
  isActive: int("isActive").default(1).notNull(),
  lastFetchedAt: timestamp("lastFetchedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RssFeed = typeof rssFeeds.$inferSelect;
export type InsertRssFeed = typeof rssFeeds.$inferInsert;