-- Sweety database schema.
-- Run once: psql "$DATABASE_URL" -f server/db/schema.sql
--
-- Time slots (exact names from the assessment):
--   'Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'
--
-- Validation messages the app must show (exact strings, enforced in code later):
--   "Please enter a glucose value."
--   "Value must be between 40 and 600 mg/dl."
--   "You already have an After lunch reading for this date."
--   "You can add only 4 readings per day."
--   "Date cannot be in the future."

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN (
    'Morning (fasting)',
    'After breakfast',
    'After lunch',
    'After dinner'
  )),
  value_mg_dl INTEGER NOT NULL CHECK (value_mg_dl BETWEEN 40 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One reading per slot per day, per user.
  UNIQUE (user_id, reading_date, time_slot)
);
