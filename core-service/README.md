# ChatWave Core Service

Core microservice for ChatWave, responsible for **users, authentication, and core domain data**.

This service is built with **Node.js + Express** and is designed to live alongside:

- `frontend/`
- `core-service/`  ⟵ this service
- `realtime-service/` (WebSocket/real‑time events, to be implemented later)

## Quick start

```bash
cd core-service
npm install
npm run dev
```

The API will start on port **5001** by default.

## Project structure

```text
core-service/
  ├─ src/
  │  ├─ server.js          # Entry: create HTTP server
  │  ├─ app.js             # Express app, middleware, routes wiring
  │  ├─ routes/            # Route definitions
  │  ├─ controllers/       # HTTP controllers (request/response)
  │  ├─ services/          # Business logic
  │  ├─ repositories/      # Data access (DB or in‑memory)
  │  ├─ models/            # Domain models / schema definitions
  │  └─ middleware/        # Auth, error handling, logging, etc.
  ├─ .env.example          # Example environment variables
  └─ package.json
```

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
PORT=5001
NODE_ENV=development
```

## Notes

- Repositories are currently implemented **in‑memory** for simplicity; you can swap them out for a real database later (MongoDB, PostgreSQL, etc.) by changing only the repository layer.
- `realtime-service/` will later handle WebSocket / Socket.IO connections and will consume events from this core service.

