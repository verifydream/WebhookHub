# 🔗 WebhookHub

> Debug webhooks bareng tim, tanpa chaos.

Team workspace untuk capture, inspect, share, dan document webhook events.

## Fitur

- **Webhook Capture** — Kirim webhook ke URL unik, semua tersimpan
- **Payload Inspector** — Inspect headers, body, source IP
- **Team Comments** — Komentar di setiap event untuk diskusi
- **Auto Docs** — Generate dokumentasi otomatis dari real payloads
- **Send Test** — Kirim test webhook langsung dari dashboard
- **Dark UI** — Developer-friendly dark theme

## Tech Stack

- Node.js + Express
- PostgreSQL
- nanoid (URL generation)
- marked (markdown → HTML)

## Quick Start

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

## API

- `POST /api/hubs` — Create hub `{ name }` → returns `{ id, secret }`
- `ALL /w/:hubId` — Webhook receiver (kirim payload ke sini)
- `GET /api/hubs/:id/events` — List events
- `GET /api/events/:id` — Event detail
- `POST /api/events/:id/comments` — Add comment `{ author, content }`
- `GET /api/hubs/:id/docs/html` — Auto-generated docs

## License

MIT
