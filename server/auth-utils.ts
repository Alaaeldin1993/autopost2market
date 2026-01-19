import { SignJWT, jwtVerify } from 'jose';
import { ENV } from './_core/env';

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret);
const JWT_ALGORITHM = 'HS256';

export interface JWTPayload {
  userId?: number;
  adminId?: number;
  email: string;
  type: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for user or admin authentication
 */
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn = '7d'): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Hash a password using Node.js crypto (bcrypt alternative)
 */
export async function hashPassword(password: string): Promise<string> {
  const crypto = await import('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const crypto = await import('crypto');
  const [salt, originalHash] = hashedPassword.split(':');
  if (!salt || !originalHash) return false;
  
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1] || null;
}
