# Sweety — Blood Glucose Tracker

Sweety is a simple blood glucose tracker built for the Kenpath take-home
assessment (Junior Full Stack Developer – JavaScript & AI, ref
KP-BLR-JFSD-2026-004). A user registers, logs in, records glucose readings
in four daily time slots, and sees daily / month-to-date / monthly reports.

Stack: Node.js + Express + PostgreSQL on the server, React (Vite) on the
client. Plain JavaScript throughout.

## Install

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

## Database setup

1. Create a PostgreSQL database, e.g. `sweety`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your database.
3. Create the tables:

```bash
psql "$DATABASE_URL" -f server/db/schema.sql
```

## Run

```bash
# Server (from server/)
npm start
# Runs on http://localhost:5000 — check http://localhost:5000/health

# Client (from client/)
npm run dev
# Runs on http://localhost:5173
```

## Tests

TODO — no tests yet.

## Notes

TODO — assumptions and things to improve with more time.
