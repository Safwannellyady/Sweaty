// Sweety seed — creates a demo user with sample readings.
// Run from server/:  DATABASE_URL=... node seed.js
// Safe to re-run: the demo user and readings are inserted with
// ON CONFLICT DO NOTHING. The demo password defaults to 'Demo1234'
// (demo data only — override with SEED_PASSWORD).
require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const pool = require('./db');

const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];

async function main() {
  const email = 'demo@sweety.app';
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || 'Demo1234', 10);
  const user = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    ['Demo User', email, passwordHash]
  );
  let userId;
  if (user.rows.length > 0) {
    userId = user.rows[0].id;
  } else {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    userId = existing.rows[0].id;
  }
  // Sample readings for the last few days (past dates only).
  const today = new Date();
  const samples = [];
  for (let d = 4; d >= 1; d--) {
    const date = new Date(today.getTime() - d * 86400000).toISOString().slice(0, 10);
    samples.push([date, SLOTS[0], 95 + d * 3]);
    samples.push([date, SLOTS[1], 140 + d * 2]);
    samples.push([date, SLOTS[3], 118 + d]);
  }
  for (const [date, slot, value] of samples) {
    await pool.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, value_mg_dl) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, reading_date, time_slot) DO NOTHING`,
      [userId, date, slot, value]
    );
  }
  console.log(`Seeded demo user ${email} with sample readings.`);
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
