import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import { UserRole } from '../types';

declare module 'express-session' {
    interface SessionData {
        userId: string;
        role: UserRole;
        userEmail: string;
        accessToken: string;
        createdAt: number;
    }
}

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds (safe integer)

// Create PostgreSQL pool from DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create PostgreSQL session store
const PostgresStore = pgSession(session);
const store = new PostgresStore({
    pool,
    tableName: 'session', // Name of the session table we created
    createTableIfMissing: true, // Automatically create the session table
    pruneSessionInterval: Math.floor(ONE_HOUR / 2), // Clean up expired sessions every 30 minutes
});

const sessionConfig = {
    store,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    rolling: true, // Reset expiration on activity
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: ONE_HOUR,
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: '/',
    }
} satisfies session.SessionOptions;

console.log('\x1b[36m%s\x1b[0m', '💾 Using PostgreSQL for session management');

// Handle store errors
store.on('error', (error: Error) => {
    console.error('\x1b[31m%s\x1b[0m', '❌ Session store error:', error);
});

export const sessionMiddleware = session(sessionConfig); 