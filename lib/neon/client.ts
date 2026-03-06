import { neon } from '@neondatabase/serverless';

// Read-only Neon connection for merchant revenue data
// NEVER write to Neon from this app — it's a shared production database
// All queries must be read-only SELECT statements

let _sql: ReturnType<typeof neon> | null = null;

export function getNeonClient() {
  if (!_sql) {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
      throw new Error('NEON_DATABASE_URL is not set');
    }
    _sql = neon(url);
  }
  return _sql;
}
