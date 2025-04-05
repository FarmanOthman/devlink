import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      role: Role;
    };
  }
}

const prisma = new PrismaClient();

interface JwtCustomPayload {
  userId: string;
  tokenVersion: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtCustomPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        tokenVersion: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if token version matches (for invalidating old tokens)
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Token is invalid' });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
}; 