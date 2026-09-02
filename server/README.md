# VEEW OS — Server

Express + TypeScript API. Data is stored in `data/db.json` through a `Store` interface so PostgreSQL can replace JSON later without rewriting services.

## Layout

```
src/
  routes/           HTTP endpoints
  services/         Business rules
  storage/          JsonStore + factory (postgres stub)
  middleware/       Auth + errors
  seed/             Initial JSON database
```

## Storage swap (later)

1. Implement `PostgresStore` with the `Store` interface in `src/storage/types.ts`
2. Register it in `src/storage/createStore.ts`
3. Set `STORAGE_DRIVER=postgres` in `.env`
