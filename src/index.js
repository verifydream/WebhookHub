import express from 'express';
import { nanoid } from 'nanoid';
import { marked } from 'marked';
import dotenv from 'dotenv';
import * as db from './db.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.text({ type: '*/*', limit: '5mb' }));

// --- Health ---
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'webhookhub' }));

// --- Create Hub ---
app.post('/api/hubs', async (req, res) => {
  const { name } = req.body;
  const id = nanoid(12);
  const secret = nanoid(32);
  const hub = await db.createHub(id, name || 'My Hub', secret);
  res.json(hub);
});

app.get('/api/hubs/:id', async (req, res) => {
  const hub = await db.getHub(req.params.id);
  if (!hub) return res.status(404).json({ error: 'Hub not found' });
  res.json(hub);
});

// --- Webhook Receiver ---
app.all('/w/:hubId', async (req, res) => {
  const hub = await db.getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: 'Hub not found' });

  let body = null;
  let rawBody = null;

  if (typeof req.body === 'string') {
    rawBody = req.body;
    try { body = JSON.parse(req.body); } catch { body = req.body; }
  } else {
    body = req.body;
    rawBody = JSON.stringify(req.body);
  }

  // Strip auth headers for privacy
  const headers = { ...req.headers };
  delete headers.authorization;
  delete headers.cookie;

  const event = await db.saveEvent(hub.id, {
    method: req.method,
    headers,
    body,
    rawBody,
    sourceIp: req.ip,
  });

  console.log(`[WEBHOOK] ${req.method} → hub:${hub.id} event:#${event.id}`);

  // Return 200 like a real webhook endpoint
  res.status(200).json({ received: true, event_id: event.id });
});

// --- Events API ---
app.get('/api/hubs/:hubId/events', async (req, res) => {
  const events = await db.getEvents(req.params.hubId, parseInt(req.query.limit) || 50);
  res.json(events);
});

app.get('/api/events/:id', async (req, res) => {
  const event = await db.getEvent(parseInt(req.params.id));
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

app.delete('/api/events/:id', async (req, res) => {
  await db.deleteEvent(parseInt(req.params.id));
  res.json({ ok: true });
});

// --- Comments ---
app.post('/api/events/:eventId/comments', async (req, res) => {
  const { author, content } = req.body;
  if (!author || !content) return res.status(400).json({ error: 'author and content required' });
  const comment = await db.addComment(parseInt(req.params.eventId), author, content);
  res.json(comment);
});

app.get('/api/events/:eventId/comments', async (req, res) => {
  const comments = await db.getComments(parseInt(req.params.eventId));
  res.json(comments);
});

// --- Auto-docs ---
app.get('/api/hubs/:hubId/docs', async (req, res) => {
  const md = await db.generateDocs(req.params.hubId);
  res.type('text/markdown').send(md);
});

app.get('/api/hubs/:hubId/docs/html', async (req, res) => {
  const md = await db.generateDocs(req.params.hubId);
  const html = marked(md);
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>WebhookHub Docs</title>
    <style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6}
    pre{background:#f5f5f5;padding:1rem;border-radius:8px;overflow-x:auto}
    h1{border-bottom:2px solid #eee;padding-bottom:.5rem}</style></head><body>${html}</body></html>`);
});

// --- Dashboard (served as HTML) ---
app.get('/', (req, res) => {
  res.send(DASHBOARD_HTML);
});

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WebhookHub</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#0f0f0f;color:#e0e0e0;min-height:100vh}
    .container{max-width:900px;margin:0 auto;padding:2rem 1rem}
    h1{font-size:1.8rem;margin-bottom:.5rem;color:#fff}
    .subtitle{color:#888;margin-bottom:2rem}
    .card{background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:1.5rem;margin-bottom:1rem}
    .input-group{display:flex;gap:.5rem;margin-bottom:1rem}
    input,textarea{background:#222;border:1px solid #444;color:#fff;padding:.6rem .8rem;border-radius:8px;font-size:.9rem}
    input:focus,textarea:focus{outline:none;border-color:#6366f1}
    button{background:#6366f1;color:#fff;border:none;padding:.6rem 1.2rem;border-radius:8px;cursor:pointer;font-size:.9rem}
    button:hover{background:#4f46e5}
    button.danger{background:#ef4444}
    .event{background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:1rem;margin-bottom:.5rem;cursor:pointer}
    .event:hover{border-color:#6366f1}
    .method{font-weight:700;padding:2px 6px;border-radius:4px;font-size:.75rem;margin-right:.5rem}
    .GET{background:#22c55e33;color:#22c55e}
    .POST{background:#3b82f633;color:#3b82f6}
    .PUT{background:#f59e0b33;color:#f59e0b}
    .DELETE{background:#ef444433;color:#ef4444}
    pre{background:#111;padding:1rem;border-radius:8px;overflow-x:auto;font-size:.8rem;max-height:400px;overflow-y:auto}
    .tag{font-size:.75rem;color:#888}
    .empty{text-align:center;color:#666;padding:3rem}
    .tabs{display:flex;gap:.5rem;margin-bottom:1rem}
    .tab{padding:.4rem .8rem;border-radius:6px;cursor:pointer;font-size:.85rem;color:#888}
    .tab.active{background:#6366f1;color:#fff}
    .comment{background:#222;border-radius:8px;padding:.8rem;margin-top:.5rem}
    .comment-author{font-weight:600;color:#6366f1;font-size:.85rem}
    .comment-text{color:#ccc;font-size:.9rem;margin-top:.2rem}
    .docs-link{color:#6366f1;text-decoration:none;font-size:.85rem}
    .url-box{background:#111;border:1px solid #333;border-radius:8px;padding:.8rem;margin-bottom:1rem;font-family:monospace;font-size:.85rem;color:#22c55e;word-break:break-all}
    .flex-between{display:flex;justify-content:space-between;align-items:center}
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 WebhookHub</h1>
    <p class="subtitle">Debug webhooks bareng tim, tanpa chaos</p>

    <div id="create-hub" class="card">
      <h3 style="margin-bottom:.8rem">Create Hub Baru</h3>
      <div class="input-group">
        <input id="hub-name" placeholder="Nama hub (misal: Stripe Dev)" style="flex:1">
        <button onclick="createHub()">Buat</button>
      </div>
    </div>

    <div id="hub-view" style="display:none">
      <div class="flex-between" style="margin-bottom:1rem">
        <h2 id="hub-title"></h2>
        <div>
          <a id="docs-link" class="docs-link" href="#" target="_blank">📄 Auto Docs</a>
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem">
        <div class="tag">Webhook URL (kirim ke provider kamu):</div>
        <div class="url-box" id="webhook-url"></div>
      </div>

      <div class="tabs">
        <div class="tab active" onclick="showTab('events',this)">Events (<span id="event-count">0</span>)</div>
        <div class="tab" onclick="showTab('send',this)">Kirim Test</div>
      </div>

      <div id="tab-events">
        <div id="events-list"></div>
      </div>

      <div id="tab-send" style="display:none">
        <div class="card">
          <h3 style="margin-bottom:.8rem">Kirim Webhook Test</h3>
          <div class="input-group">
            <select id="test-method" style="width:100px">
              <option>POST</option><option>GET</option><option>PUT</option><option>DELETE</option>
            </select>
            <button onclick="sendTest()">Kirim</button>
          </div>
          <textarea id="test-body" rows="8" placeholder='{"event":"payment.completed","amount":50000}' style="width:100%;font-family:monospace;font-size:.85rem"></textarea>
        </div>
      </div>

      <div id="event-detail" style="display:none">
        <div class="card">
          <div class="flex-between" style="margin-bottom:1rem">
            <h3 id="detail-title">Event Detail</h3>
            <button onclick="closeDetail()" style="background:#333">✕ Close</button>
          </div>
          <pre id="detail-payload"></pre>
          <div id="detail-comments" style="margin-top:1rem"></div>
          <div class="input-group" style="margin-top:1rem">
            <input id="comment-author" placeholder="Nama" style="width:120px">
            <input id="comment-content" placeholder="Komentar..." style="flex:1">
            <button onclick="addComment()">💬</button>
          </div>
        </div>
      </div>
    </div>
  </div>

<script>
let currentHub = null;

async function createHub() {
  const name = document.getElementById('hub-name').value || 'My Hub';
  const res = await fetch('/api/hubs', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name}) });
  const hub = await res.json();
  currentHub = hub;
  showHub(hub);
}

function showHub(hub) {
  currentHub = hub;
  document.getElementById('create-hub').style.display = 'none';
  document.getElementById('hub-view').style.display = 'block';
  document.getElementById('hub-title').textContent = hub.name;
  const baseUrl = window.location.origin;
  document.getElementById('webhook-url').textContent = baseUrl + '/w/' + hub.id;
  document.getElementById('docs-link').href = '/api/hubs/' + hub.id + '/docs/html';
  loadEvents();
}

async function loadEvents() {
  if (!currentHub) return;
  const res = await fetch('/api/hubs/' + currentHub.id + '/events');
  const events = await res.json();
  document.getElementById('event-count').textContent = events.length;
  const list = document.getElementById('events-list');
  if (!events.length) { list.innerHTML = '<div class="empty">Belum ada event. Kirim test di tab sebelah.</div>'; return; }
  list.innerHTML = events.map(e => {
    const time = new Date(e.received_at).toLocaleString('id-ID');
    return '<div class="event" onclick="showEvent(' + e.id + ')">' +
      '<span class="method ' + e.method + '">' + e.method + '</span>' +
      '<span style="color:#fff">#' + e.id + '</span> ' +
      '<span class="tag">' + time + '</span>' +
      (e.source_ip ? '<span class="tag"> from ' + e.source_ip + '</span>' : '') +
      '</div>';
  }).join('');
}

async function showEvent(id) {
  const res = await fetch('/api/events/' + id);
  const event = await res.json();
  document.getElementById('event-detail').style.display = 'block';
  document.getElementById('detail-title').textContent = 'Event #' + event.id + ' — ' + event.method;
  document.getElementById('detail-payload').textContent = JSON.stringify(event.body || event.raw_body, null, 2);
  document.getElementById('current-event-id', id);
  window._currentEventId = id;

  const commRes = await fetch('/api/events/' + id + '/comments');
  const comments = await commRes.json();
  const commDiv = document.getElementById('detail-comments');
  commDiv.innerHTML = comments.length
    ? '<div class="tag" style="margin-bottom:.5rem">Komentar:</div>' +
      comments.map(c => '<div class="comment"><div class="comment-author">' + c.author + '</div><div class="comment-text">' + c.content + '</div></div>').join('')
    : '';
}

function closeDetail() { document.getElementById('event-detail').style.display = 'none'; }

async function sendTest() {
  if (!currentHub) return;
  const method = document.getElementById('test-method').value;
  const body = document.getElementById('test-body').value || '{}';
  await fetch('/w/' + currentHub.id, { method, headers:{'Content-Type':'application/json'}, body });
  loadEvents();
}

async function addComment() {
  const author = document.getElementById('comment-author').value;
  const content = document.getElementById('comment-content').value;
  if (!author || !content) return;
  await fetch('/api/events/' + window._currentEventId + '/comments', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({author, content})
  });
  document.getElementById('comment-content').value = '';
  showEvent(window._currentEventId);
}

function showTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-events').style.display = tab === 'events' ? '' : 'none';
  document.getElementById('tab-send').style.display = tab === 'send' ? '' : 'none';
  if (tab === 'events') loadEvents();
}

// Check if hub ID in URL
const params = new URLSearchParams(window.location.search);
const hubId = params.get('hub');
if (hubId) fetch('/api/hubs/' + hubId).then(r=>r.json()).then(hub => { if(hub.id) showHub(hub); });
</script>
</body></html>`;

const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔗 WebhookHub running on port ${PORT}`);
});
