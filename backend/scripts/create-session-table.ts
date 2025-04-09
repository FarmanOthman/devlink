import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function createSessionTable() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('Creating session table...');
        const sql = readFileSync(
            join(__dirname, '../prisma/migrations/session_table.sql'),
            'utf8'
        );
        await pool.query(sql);
        console.log('Session table created successfully!');
    } catch (error) {
        console.error('Error creating session table:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

createSessionTable().catch((error) => {
    console.error('Failed to create session table:', error);
    process.exit(1);
}); 