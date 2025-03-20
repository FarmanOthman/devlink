export enum UserRole {
    DEVELOPER = 'developer',
    RECRUITER = 'recruiter',
    ADMIN = 'admin'
}

export interface JwtPayload {
    userId: string;
    role: UserRole;
    email: string;
    [key: string]: any;
} 