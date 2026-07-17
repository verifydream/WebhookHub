# 🔗 WebhookHub

> Debug webhooks bareng tim, tanpa chaos.

Team workspace untuk capture, inspect, share, dan document webhook events.

## 🚀 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 + React |
| Backend | Next.js API Routes + Hono |
| Database | PostgreSQL (Supabase-ready) |
| Auth | Clerk (env-ready) |
| Styling | Tailwind CSS (dark theme) |

## 📦 Features

- ✅ Create webhook hubs with unique URLs
- ✅ Capture incoming webhooks (`/api/w/:hubId`)
- ✅ Dark dashboard with payload inspector
- ✅ Team commenting on events
- ✅ Auto-generated docs from real payloads
- ✅ Send test webhooks from dashboard

## 🏁 Quick Start

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

## 🔧 Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/webhookhub
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
CLERK_SECRET_KEY=your_clerk_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/hubs` | Create hub |
| GET | `/api/hubs/:id` | Get hub info |
| ALL | `/api/w/:hubId` | Webhook receiver |
| GET | `/api/hubs/:id/events` | List events |
| GET | `/api/events/:id` | Event detail |
| POST | `/api/events/:id/comments` | Add comment |
| GET | `/api/hubs/:id/docs` | Auto-generated docs |

## 📂 Project Structure

```
webhookhub/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── hubs/
│   │   │   ├── w/[hubId]/
│   │   │   └── events/[id]/
│   │   ├── layout.jsx
│   │   └── page.js
│   └── lib/
│       ├── db.js
│       └── db-migrate.js
├── .env.example
└── README.md
```

## 📄 License

MIT
