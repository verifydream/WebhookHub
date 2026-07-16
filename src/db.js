import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', err => console.error('Pool error:', err));

export default pool;

// --- Hubs ---
export async function createHub(id, name, secret) {
  const { rows } = await pool.query(
    'INSERT INTO hubs (id, name, secret) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2 RETURNING *',
    [id, name, secret]
  );
  return rows[0];
}

export async function getHub(id) {
  const { rows } = await pool.query('SELECT * FROM hubs WHERE id = $1', [id]);
  return rows[0] || null;
}

// --- Events ---
export async function saveEvent(hubId, { method, headers, body, rawBody, sourceIp }) {
  const { rows } = await pool.query(
    `INSERT INTO webhook_events (hub_id, method, headers, body, raw_body, source_ip)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [hubId, method, JSON.stringify(headers), body ? JSON.stringify(body) : null, rawBody, sourceIp]
  );
  return rows[0];
}

export async function getEvents(hubId, limit = 50) {
  const { rows } = await pool.query(
    'SELECT * FROM webhook_events WHERE hub_id = $1 ORDER BY received_at DESC LIMIT $2',
    [hubId, limit]
  );
  return rows;
}

export async function getEvent(id) {
  const { rows } = await pool.query('SELECT * FROM webhook_events WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function deleteEvent(id) {
  await pool.query('DELETE FROM webhook_events WHERE id = $1', [id]);
}

// --- Comments ---
export async function addComment(eventId, author, content) {
  const { rows } = await pool.query(
    'INSERT INTO comments (event_id, author, content) VALUES ($1, $2, $3) RETURNING *',
    [eventId, author, content]
  );
  return rows[0];
}

export async function getComments(eventId) {
  const { rows } = await pool.query(
    'SELECT * FROM comments WHERE event_id = $1 ORDER BY created_at ASC',
    [eventId]
  );
  return rows;
}

// --- Auto-docs ---
export async function generateDocs(hubId) {
  const events = await getEvents(hubId, 100);
  if (!events.length) return '# No events captured yet';

  const grouped = {};
  for (const e of events) {
    const key = `${e.method} ${JSON.parse(e.headers)?.['x-webhook-event'] || e.headers?.['x-webhook-event'] || 'unknown'}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  let md = `# WebhookHub — Auto-Generated Docs\n\n`;
  md += `Hub: **${hubId}** | Events captured: **${events.length}**\n\n`;

  for (const [event, evts] of Object.entries(grouped)) {
    md += `## ${event}\n\n`;
    const sample = evts[0];
    const body = sample.body || JSON.parse(sample.raw_body || '{}');
    md += `**Payload structure:**\n\n\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\`\n\n`;
    md += `Captured **${evts.length}** times.\n\n`;
  }

  return md;
}
