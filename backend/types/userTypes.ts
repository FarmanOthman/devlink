import { Role } from '@prisma/client';

export interface JwtPayload {
    userId: string;
    role: Role;
    email: string;
    [key: string]: any;
} 