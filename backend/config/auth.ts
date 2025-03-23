import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Debug environment variables (remove in production)
console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);
console.log('REFRESH_TOKEN_SECRET is set:', !!process.env.REFRESH_TOKEN_SECRET);

// Check for JWT secrets with fallbacks for development
let JWT_SECRET: Secret;
let REFRESH_TOKEN_SECRET: Secret;

if (process.env.NODE_ENV === 'production') {
  // In production, we require proper environment variables
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be provided in environment variables for production');
  }
  JWT_SECRET = process.env.JWT_SECRET;
  REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
} else {
  // In development, fall back to defaults if needed
  JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-do-not-use-in-production';
  REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret-key-do-not-use-in-production';
  
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    console.warn('Using fallback JWT secrets for development. DO NOT USE IN PRODUCTION!');
  }
}

const SALT_ROUNDS = 12; // Increased from 10 for better security

// Token expiration constants
export const TOKEN_EXPIRATION = {
  ACCESS: 900, // 15 minutes in seconds
  REFRESH: 604800, // 7 days in seconds
  REFRESH_MS: 7 * 24 * 60 * 60 * 1000,
  INACTIVITY_TIMEOUT: 30 * 24 * 60 * 60 * 1000,
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
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

// Generate an access token with additional security measures
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: TOKEN_EXPIRATION.ACCESS,
    algorithm: 'HS256',
    audience: process.env.JWT_AUDIENCE || 'devlink-api',
    issuer: process.env.JWT_ISSUER || 'devlink',
    jwtid: Math.random().toString(36).substring(7) // Unique token ID
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

// Generate a refresh token with additional security measures
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: TOKEN_EXPIRATION.REFRESH,
    algorithm: 'HS256',
    audience: process.env.JWT_AUDIENCE || 'devlink-api',
    issuer: process.env.JWT_ISSUER || 'devlink',
    jwtid: Math.random().toString(36).substring(7)
  };
  return jwt.sign(
    { 
      ...payload, 
      tokenVersion: (payload.tokenVersion || 0) + 1 // Increment token version
    },
    REFRESH_TOKEN_SECRET,
    options
  );
};

// Verify an access token with additional validation
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      audience: process.env.JWT_AUDIENCE || 'devlink-api',
      issuer: process.env.JWT_ISSUER || 'devlink',
    }) as TokenPayload;

    // Additional validation
    if (!decoded.userId || !decoded.role || !decoded.email) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify a refresh token with additional validation
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
      algorithms: ['HS256'],
      audience: process.env.JWT_AUDIENCE || 'devlink-api',
      issuer: process.env.JWT_ISSUER || 'devlink',
    }) as TokenPayload;

    // Additional validation
    if (!decoded.userId || !decoded.role || !decoded.email || decoded.tokenVersion === undefined) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Cookie options for refresh token with enhanced security
export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/api/auth', // More specific path
  maxAge: TOKEN_EXPIRATION.REFRESH_MS,
});