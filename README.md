# Sweety — Blood Glucose Tracker

Sweety is a simple blood glucose tracker built for the Kenpath take-home
assessment (Junior Full Stack Developer – JavaScript & AI, ref
KP-BLR-JFSD-2026-004). A user registers, logs in, records glucose readings
in four daily time slots, and sees daily / month-to-date / monthly reports.

Stack: Node.js + Express + PostgreSQL on the server, React (Vite) on the
client. Plain JavaScript throughout.

Live demo: https://sweety-client.onrender.com
API: https://sweety-server-u0s3.onrender.com

## What it does

- Register / log in — passwords are bcrypt-hashed, never stored in plain text;
  after login a user only ever sees their own readings.
- Readings — date + time slot + value (mg/dl). Time slots: Morning (fasting),
  After breakfast, After lunch, After dinner. One reading per slot per day,
  at most 4 readings a day, values 40–600 mg/dl, no future dates. Each rule
  shows its exact message from the brief.
- Reports — daily (the selected date, with each reading listed), month-to-date
  (1st of the month to the selected date) and monthly (the whole previous
  month). Each shows highest, lowest and average (1 decimal) + number of
  readings, with a friendly empty state when there are none.

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

4. (Optional) Seed a demo user with sample readings:

```bash
cd server
node seed.js
# Demo login: demo@sweety.app / Demo1234 (demo data only;
# override the password with SEED_PASSWORD)
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

## API

| Method | Path | What it does |
| --- | --- | --- |
| POST | /api/auth/register | Create an account (name, email, password) |
| POST | /api/auth/login | Log in, returns a JWT |
| GET | /api/readings?date=YYYY-MM-DD | List the day's readings |
| POST | /api/readings | Add a reading (date, time_slot, value) |
| DELETE | /api/readings/:id | Delete a reading |
| GET | /api/reports/daily?date= | Daily report |
| GET | /api/reports/month-to-date?date= | Month-to-date report |
| GET | /api/reports/monthly?date= | Monthly report (previous month) |

All `/api/readings` and `/api/reports` routes need
`Authorization: Bearer <token>`.

## Deploy

The app deploys on Render from this repo: the server as a Node web service
(root `server`, `npm start`) and the client as a static site (root `client`,
`npm run build`, publish `dist`). Pushing to `main` redeploys both
automatically. The server needs `DATABASE_URL` and `JWT_SECRET` set as
environment variables.

## Notes

- Dates are compared against the server date (UTC). "Monthly" means the whole
  calendar month before the selected date's month.
- The demo account seeded by `server/seed.js` holds only sample data, for
  trying the app.
- With more time I would add: automated API tests against a test database,
  a trend chart for the reports, pagination for long reading lists, refresh
  tokens instead of a 7-day JWT, and rate limiting on the login endpoint.
