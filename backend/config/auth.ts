import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET: Secret = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';
const SALT_ROUNDS = 10;

// Token expiration constants
export const TOKEN_EXPIRATION = {
  ACCESS: 3600, // 1 hour in seconds
  REFRESH: 604800, // 7 days in seconds
  REFRESH_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  INACTIVITY_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
};

// Hash a password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare a password with its hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

interface TokenPayload {
  userId: string;
  role: Role;
  email: string;
  tokenVersion?: number; // For refresh token rotation
}

// Generate an access token
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: TOKEN_EXPIRATION.ACCESS,
    algorithm: 'HS256'
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Generate a refresh token
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: TOKEN_EXPIRATION.REFRESH,
    algorithm: 'HS256'
  };
  return jwt.sign(
    { ...payload, tokenVersion: payload.tokenVersion || 0 },
    REFRESH_TOKEN_SECRET,
    options
  );
};

// Verify an access token
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify a refresh token
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Cookie options for refresh token
export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
  maxAge: TOKEN_EXPIRATION.REFRESH_MS,
});