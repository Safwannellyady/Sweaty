// Sweety readings — add, list and delete glucose readings (step 3).
// All five validation rules from the assessment, with the exact messages.
// Every query is scoped to the logged-in user, so a user only ever sees
// their own readings.
const pool = require('./db');

const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];
const SLOT_ORDER = "CASE time_slot WHEN 'Morning (fasting)' THEN 0 WHEN 'After breakfast' THEN 1 WHEN 'After lunch' THEN 2 WHEN 'After dinner' THEN 3 ELSE 4 END";
const MAX_PER_DAY = 4;
const MIN_VALUE = 40;
const MAX_VALUE = 600;

// Server date (UTC) as YYYY-MM-DD. Dates are compared as plain ISO strings.
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str) && !Number.isNaN(Date.parse(str + 'T00:00:00Z'));
}

function serialize(row) {
  const date = row.reading_date instanceof Date
    ? row.reading_date.toISOString().slice(0, 10)
    : row.reading_date;
  return { id: row.id, date, time_slot: row.time_slot, value: row.value_mg_dl };
}

async function addReading(req, res) {
  const { reading_date, time_slot, value } = req.body || {};
  const date = reading_date || todayISO();

  // 1. A value is required.
  if (value === undefined || value === null || value === '') {
    return res.status(400).json({ error: 'Please enter a glucose value.' });
  }
  const num = Number(value);
  // 2. Range 40–600 mg/dl (also catches non-numbers and decimals).
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < MIN_VALUE || num > MAX_VALUE) {
    return res.status(400).json({ error: 'Value must be between 40 and 600 mg/dl.' });
  }
  if (!SLOTS.includes(time_slot)) {
    return res.status(400).json({ error: 'Please choose a time slot.' });
  }
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Please enter a valid date.' });
  }
  // 3. No future dates.
  if (date > todayISO()) {
    return res.status(400).json({ error: 'Date cannot be in the future.' });
  }
  try {
    // 4. One reading per slot per day.
    const dup = await pool.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
      [req.userId, date, time_slot]
    );
    if (dup.rows.length > 0) {
      return res.status(400).json({ error: `You already have an ${time_slot} reading for this date.` });
    }
    // 5. At most 4 readings per day.
    const count = await pool.query(
      'SELECT COUNT(*)::int AS n FROM readings WHERE user_id = $1 AND reading_date = $2',
      [req.userId, date]
    );
    if (count.rows[0].n >= MAX_PER_DAY) {
      return res.status(400).json({ error: 'You can add only 4 readings per day.' });
    }
    const result = await pool.query(
      'INSERT INTO readings (user_id, reading_date, time_slot, value_mg_dl) VALUES ($1, $2, $3, $4) RETURNING id, reading_date, time_slot, value_mg_dl',
      [req.userId, date, time_slot, num]
    );
    res.status(201).json({ reading: serialize(result.rows[0]) });
  } catch (err) {
    // Backstop for the UNIQUE(user, date, slot) constraint if two requests race.
    if (err.code === '23505') {
      return res.status(400).json({ error: `You already have an ${time_slot} reading for this date.` });
    }
    console.error('add reading failed', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listReadings(req, res) {
  const date = req.query.date || todayISO();
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Please enter a valid date.' });
  }
  try {
    const result = await pool.query(
      `SELECT id, reading_date, time_slot, value_mg_dl FROM readings
       WHERE user_id = $1 AND reading_date = $2 ORDER BY ${SLOT_ORDER}`,
      [req.userId, date]
    );
    res.json({ date, readings: result.rows.map(serialize) });
  } catch (err) {
    console.error('list readings failed', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function deleteReading(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Reading not found.' });
  }
  try {
    const result = await pool.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('delete reading failed', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { addReading, listReadings, deleteReading, SLOTS };
