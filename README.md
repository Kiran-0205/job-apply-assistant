# Job Apply Assistant

A personal, human-in-the-loop web app that prepares job application materials — it never sends anything on your behalf.

## Setup

### 1. Prerequisites

- Node.js 20+
- PostgreSQL running locally

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | How to get |
|---|---|
| `DATABASE_URL` | Your Postgres connection string. Create the DB first: `createdb jobassist` |
| `ANTHROPIC_API_KEY` | [console.anthropic.com → API Keys](https://console.anthropic.com/settings/keys) |

### 4. Run the database migration

```bash
npm run db:migrate
# When prompted for a migration name, type: init
```

This creates all tables from `prisma/schema.prisma`.

### 5. Seed the database

```bash
npm run db:seed
```

Creates one user (`saikiran@example.com`) so routes have a userId to attach to.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the dashboard.

## Useful commands

```bash
npm run db:studio    # Prisma Studio — visual DB browser
npm run db:generate  # Regenerate Prisma client after schema changes
npm run build        # Production build
```

## Pipeline overview

1. **Ingest** — paste a job description (text) or a career-portal URL
2. **Extract** — LLM parses it into structured fields (company, title, applyMethod, …)
3. **Classify** — routing decision: EMAIL or PORTAL
4. **Generate** — EMAIL → tailored email draft; PORTAL → referral message + LinkedIn connection note + search link
5. **Act** — you click; app logs the status update; nothing is sent automatically
