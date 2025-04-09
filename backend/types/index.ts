import { Role } from '@prisma/client';

export * from './userTypes';
// Add other type exports here as needed

// Re-export Role from Prisma as UserRole for backward compatibility
export { Role as UserRole }; 