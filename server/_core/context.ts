import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, Admin } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyToken, extractTokenFromHeader } from "../auth-utils";
import { getAdminById } from "../db";

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

  // Try Manus OAuth authentication first
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Try admin JWT authentication from Authorization header
  const authHeader = opts.req.headers.authorization;
  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.type === 'admin' && payload.adminId) {
        admin = await getAdminById(payload.adminId) || null;
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
