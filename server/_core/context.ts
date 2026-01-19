import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, Admin } from "../../drizzle/schema";
import { verifyToken, extractTokenFromHeader } from "../auth-utils";
import { getAdminById, getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  admin: Admin | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let admin: Admin | null = null;

  // Try JWT authentication from Authorization header
  const authHeader = opts.req.headers.authorization;
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        if (payload.type === 'admin' && payload.adminId) {
          admin = await getAdminById(payload.adminId) || null;
        } else if (payload.type === 'user' && payload.userId) {
          user = await getUserById(payload.userId) || null;
        }
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    admin,
  };
}
