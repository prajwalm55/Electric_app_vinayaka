# VEEW OS

Meter installation management system for Vinayaka Electricals and Engineering Works (Chitradurga).

```
Electric_app/
├── client/     React + Tailwind frontend
└── server/     Express API with JSON storage (Postgres later)
```

## Run locally

Requires **Node 24** (`nvm use 24`).

```bash
nvm use 24
npm run install:all
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:4000/api/health
- Login password: `veew2026`

## Architecture

The server uses a `Store` interface. Today `JsonStore` writes `server/data/db.json`. Later, add `PostgresStore` implementing the same interface and set `STORAGE_DRIVER=postgres`. Routes and services stay the same.

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Client + server together |
| `npm run dev:client` | Frontend only |
| `npm run dev:server` | API only |
# Electric_app_vinayaka
