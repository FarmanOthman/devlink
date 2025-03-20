export enum UserRole {
    DEVELOPER = 'DEVELOPER',
    RECRUITER = 'RECRUITER',
    ADMIN = 'ADMIN'
}

export interface JwtPayload {
    userId: string;
    role: UserRole;
    email: string;
    [key: string]: any;
} 