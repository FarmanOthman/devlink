import { PrismaClient, Role } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TOKEN_EXPIRATION } from '../config/auth';

const prisma = new PrismaClient();

interface TokenData {
  userId: string;
  role: Role;
  email: string;
  tokenVersion: number;
}

class TokenService {
  private static instance: TokenService;
  private tokenBlacklist: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  // Generate new token pair
  async generateTokenPair(userId: string, role: Role, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true }
    });

    if (!user) throw new Error('User not found');

    const tokenData: TokenData = {
      userId,
      role,
      email,
      tokenVersion: user.tokenVersion
    };

    const accessToken = generateAccessToken(tokenData);
    const refreshToken = generateRefreshToken(tokenData);

    return { accessToken, refreshToken };
  }

  // Rotate refresh token
  async rotateRefreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = verifyRefreshToken(oldRefreshToken);
      
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(oldRefreshToken)) {
        throw new Error('Refresh token has been revoked');
      }

      // Increment token version to invalidate all old refresh tokens
      await prisma.user.update({
        where: { id: payload.userId },
        data: { tokenVersion: { increment: 1 } }
      });

      // Blacklist the old refresh token
      this.blacklistToken(oldRefreshToken);

      // Generate new token pair
      return this.generateTokenPair(payload.userId, payload.role, payload.email);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Check if a token is blacklisted
  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }

  // Add a token to the blacklist
  blacklistToken(token: string): void {
    this.tokenBlacklist.add(token);
    // Remove from blacklist after expiration
    setTimeout(() => {
      this.tokenBlacklist.delete(token);
    }, TOKEN_EXPIRATION.REFRESH_MS);
  }

  // Check user activity and extend session if needed
  async checkActivity(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() }
    });
  }

  // Check if user has exceeded inactivity timeout
  async hasExceededInactivityTimeout(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActive: true }
    });

    if (!user || !user.lastActive) return true;

    const inactiveTime = Date.now() - user.lastActive.getTime();
    return inactiveTime > TOKEN_EXPIRATION.INACTIVITY_TIMEOUT;
  }
}

export const tokenService = TokenService.getInstance(); 