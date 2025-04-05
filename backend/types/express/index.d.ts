import { JwtPayload } from '../userTypes';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: Role;
  };
}

declare global {
    namespace Express {
        export interface Request {
            user: {
                userId: string;
                email: string;
                role: Role;
            } | null;
        }
    }
} 