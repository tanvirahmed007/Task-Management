// lib/db.ts
import { Pool, QueryResult, QueryResultRow } from "pg";

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } // Required for Supabase in production
    : false,
});

// Generic query function with typing
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res;
  } finally {
    client.release();
  }
}
