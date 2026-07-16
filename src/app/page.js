'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [hub, setHub] = useState(null);
  const [events, setEvents] = useState([]);
  const [detail, setDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [testMethod, setTestMethod] = useState('POST');
  const [testBody, setTestBody] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentContent, setCommentContent] = useState('');

  async function loadEvents() {
    if (!hub) return;
    const r = await fetch('/api/hubs/' + hub.id + '/events');
    setEvents(await r.json());
  }

  async function createHub() {
    const name = prompt('Nama hub:') || 'My Hub';
    const r = await fetch('/api/hubs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const h = await r.json();
    setHub(h);
  }

  async function showEvent(id) {
    const r = await fetch('/api/events/' + id);
    const e = await r.json();
    setDetail(e);
    const cr = await fetch('/api/events/' + id + '/comments');
    setComments(await cr.json());
  }

  async function sendTest() {
    if (!hub) return;
    await fetch('/api/w/' + hub.id, {
      method: testMethod,
      headers: { 'Content-Type': 'application/json' },
      body: testBody || '{}'
    });
    loadEvents();
  }

  async function addComment() {
    if (!detail || !commentAuthor || !commentContent) return;
    await fetch('/api/events/' + detail.id + '/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: commentAuthor, content: commentContent })
    });
    setCommentContent('');
    showEvent(detail.id);
  }

  useEffect(() => { if (hub) loadEvents(); }, [hub]);

  if (!hub) return (
    <div className="max-w-2xl mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-2">🔗 WebhookHub</h1>
      <p className="text-[#888] text-sm mb-6">Debug webhooks bareng tim, tanpa chaos</p>
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">Create Hub Baru</h3>
        <button onClick={createHub} className="bg-[#6366f1] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#4f46e5]">Buat Hub</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{hub.name}</h1>
        <a href={'/api/hubs/' + hub.id + '/docs'} target="_blank" className="text-[#6366f1] text-sm hover:underline">📄 Auto Docs</a>
      </div>

      <div className="bg-[#111] border border-[#333] rounded-xl p-3 mb-4">
        <div className="text-[10px] text-[#888] mb-1">Webhook URL:</div>
        <code className="text-[#22c55e] text-xs break-all">{typeof window !== 'undefined' ? window.location.origin : ''}/api/w/{hub.id}</code>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => { setDetail(null); loadEvents(); }} className={`px-3 py-1 rounded-lg text-sm ${!detail ? 'bg-[#6366f1] text-white' : 'text-[#888]'}`}>Events ({events.length})</button>
        <button onClick={() => setDetail({ _send: true })} className={`px-3 py-1 rounded-lg text-sm ${detail?._send ? 'bg-[#6366f1] text-white' : 'text-[#888]'}`}>Kirim Test</button>
      </div>

      {detail?._send && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">Kirim Webhook Test</h3>
          <div className="flex gap-2 mb-2">
            <select value={testMethod} onChange={e => setTestMethod(e.target.value)} className="bg-[#222] border border-[#444] text-white px-2 py-1.5 rounded-lg text-sm">
              <option>POST</option><option>GET</option><option>PUT</option>
            </select>
            <button onClick={sendTest} className="bg-[#6366f1] text-white px-3 py-1.5 rounded-lg text-sm">Kirim</button>
          </div>
          <textarea value={testBody} onChange={e => setTestBody(e.target.value)} rows={6} placeholder='{"event":"payment.completed","amount":50000}' className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] p-3 rounded-lg text-xs font-mono" />
        </div>
      )}

      {!detail && events.map(e => (
        <div key={e.id} onClick={() => showEvent(e.id)} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 mb-2 cursor-pointer hover:border-[#6366f1] transition">
          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-[#3b82f633] text-[#60a5fa] mr-2">{e.method}</span>
          <span className="text-white text-sm">#{e.id}</span>
          <span className="text-[#888] text-xs ml-2">{new Date(e.received_at).toLocaleString('id-ID')}</span>
          {e.source_ip && <span className="text-[#666] text-xs ml-2">from {e.source_ip}</span>}
        </div>
      ))}

      {detail && !detail._send && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">Event #{detail.id} — {detail.method}</h3>
            <button onClick={() => setDetail(null)} className="bg-[#333] text-[#ccc] px-2 py-1 rounded-lg text-xs">✕ Close</button>
          </div>
          <pre className="bg-[#111] p-3 rounded-lg text-xs overflow-x-auto max-h-80 overflow-y-auto">{JSON.stringify(detail.body || detail.raw_body, null, 2)}</pre>

          {comments.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] text-[#888] mb-1">Komentar:</div>
              {comments.map(c => (
                <div key={c.id} className="bg-[#222] rounded-lg p-2 mb-1">
                  <div className="text-[#6366f1] text-xs font-bold">{c.author}</div>
                  <div className="text-[#ccc] text-sm">{c.content}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <input value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} placeholder="Nama" className="w-24 bg-[#222] border border-[#444] text-white px-2 py-1 rounded-lg text-sm" />
            <input value={commentContent} onChange={e => setCommentContent(e.target.value)} placeholder="Komentar..." className="flex-1 bg-[#222] border border-[#444] text-white px-2 py-1 rounded-lg text-sm" />
            <button onClick={addComment} className="bg-[#6366f1] text-white px-3 py-1 rounded-lg text-sm">💬</button>
          </div>
        </div>
      )}
    </div>
  );
}
