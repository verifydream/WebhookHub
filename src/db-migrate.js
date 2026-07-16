import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const SCHEMA = `
CREATE TABLE IF NOT EXISTS hubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  hub_id TEXT REFERENCES hubs(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  body JSONB,
  raw_body TEXT,
  source_ip TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES webhook_events(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function migrate() {
  await pool.query(SCHEMA);
  console.log('✅ Database migrated');
  await pool.end();
}
migrate().catch(e => { console.error(e); process.exit(1); });
