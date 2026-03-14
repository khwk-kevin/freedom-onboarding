import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error('NEON_DATABASE_URL is not set');

export const sql = neon(databaseUrl);
