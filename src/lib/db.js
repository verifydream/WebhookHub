import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export default pool;

export async function createHub(id, name, secret) {
  const { rows } = await pool.query(
    'INSERT INTO hubs (id,name,secret) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=$2 RETURNING *',
    [id, name, secret]);
  return rows[0];
}
export async function getHub(id) {
  const { rows } = await pool.query('SELECT * FROM hubs WHERE id=$1', [id]);
  return rows[0];
}
export async function saveEvent(hubId, { method, headers, body, rawBody, sourceIp }) {
  const { rows } = await pool.query(
    `INSERT INTO webhook_events (hub_id,method,headers,body,raw_body,source_ip) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [hubId, method, JSON.stringify(headers), body ? JSON.stringify(body) : null, rawBody, sourceIp]);
  return rows[0];
}
export async function getEvents(hubId, limit = 50) {
  const { rows } = await pool.query('SELECT * FROM webhook_events WHERE hub_id=$1 ORDER BY received_at DESC LIMIT $2', [hubId, limit]);
  return rows;
}
export async function getEvent(id) {
  const { rows } = await pool.query('SELECT * FROM webhook_events WHERE id=$1', [id]);
  return rows[0];
}
export async function deleteEvent(id) { await pool.query('DELETE FROM webhook_events WHERE id=$1', [id]); }
export async function addComment(eventId, author, content) {
  const { rows } = await pool.query('INSERT INTO comments (event_id,author,content) VALUES ($1,$2,$3) RETURNING *', [eventId, author, content]);
  return rows[0];
}
export async function getComments(eventId) {
  const { rows } = await pool.query('SELECT * FROM comments WHERE event_id=$1 ORDER BY created_at', [eventId]);
  return rows;
}
export async function generateDocs(hubId) {
  const events = await getEvents(hubId, 100);
  if (!events.length) return '# No events captured yet';
  const grouped = {};
  for (const e of events) {
    const key = e.method + ' ' + (e.headers?.['x-webhook-event'] || 'unknown');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }
  let md = '# WebhookHub — Auto-Generated Docs\n\nHub: **' + hubId + '** | Events: **' + events.length + '**\n\n';
  for (const [event, evts] of Object.entries(grouped)) {
    const body = evts[0].body || {};
    md += '## ' + event + '\n\n```json\n' + JSON.stringify(body, null, 2) + '\n```\n\nCaptured **' + evts.length + '** times.\n\n';
  }
  return md;
}
