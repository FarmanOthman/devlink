import { Request } from 'express';
import { Role } from '@prisma/client';

interface AuthUser {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export type { AuthUser }; 