// Sweety reports (step 4): daily, month-to-date, monthly.
// Each report shows highest, lowest and average (rounded to 1 decimal)
// plus the number of readings. With no readings, the stats are null and
// the client shows a friendly empty state.
// "Monthly" is the whole calendar month before the selected date's month.
const pool = require('./db');

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(str) {
  return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str) && !Number.isNaN(Date.parse(str + 'T00:00:00Z'));
}

function stats(rows) {
  if (rows.length === 0) return { count: 0, highest: null, lowest: null, average: null };
  const values = rows.map((r) => r.value_mg_dl);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: rows.length,
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((sum / rows.length) * 10) / 10,
  };
}

function serialize(row) {
  const date = row.reading_date instanceof Date
    ? row.reading_date.toISOString().slice(0, 10)
    : row.reading_date;
  return { id: row.id, date, time_slot: row.time_slot, value: row.value_mg_dl };
}

async function fetchReadings(userId, from, to) {
  const result = await pool.query(
    `SELECT id, reading_date, time_slot, value_mg_dl FROM readings
     WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
     ORDER BY reading_date, CASE time_slot
       WHEN 'Morning (fasting)' THEN 0 WHEN 'After breakfast' THEN 1
       WHEN 'After lunch' THEN 2 WHEN 'After dinner' THEN 3 ELSE 4 END`,
    [userId, from, to]
  );
  return result.rows;
}

function monthStart(dateStr) {
  return dateStr.slice(0, 7) + '-01';
}

function previousMonthRange(dateStr) {
  const [year, month] = dateStr.split('-').map(Number);
  const prev = new Date(Date.UTC(month === 1 ? year - 1 : year, month === 1 ? 11 : month - 2, 1));
  const y = prev.getUTCFullYear();
  const m = String(prev.getUTCMonth() + 1).padStart(2, '0');
  const lastDay = new Date(Date.UTC(y, prev.getUTCMonth() + 1, 0)).getUTCDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, '0')}`, label: `${y}-${m}` };
}

async function dailyReport(req, res) {
  const date = req.query.date || todayISO();
  if (!isValidDate(date)) return res.status(400).json({ error: 'Please enter a valid date.' });
  try {
    const rows = await fetchReadings(req.userId, date, date);
    res.json({ type: 'daily', date, from: date, to: date, ...stats(rows), readings: rows.map(serialize) });
  } catch (err) {
    console.error('daily report failed', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function monthToDateReport(req, res) {
  const date = req.query.date || todayISO();
  if (!isValidDate(date)) return res.status(400).json({ error: 'Please enter a valid date.' });
  const from = monthStart(date);
  try {
    const rows = await fetchReadings(req.userId, from, date);
    res.json({ type: 'month-to-date', date, from, to: date, ...stats(rows), readings: rows.map(serialize) });
  } catch (err) {
    console.error('month-to-date report failed', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function monthlyReport(req, res) {
  const date = req.query.date || todayISO();
  if (!isValidDate(date)) return res.status(400).json({ error: 'Please enter a valid date.' });
  const { from, to, label } = previousMonthRange(date);
  try {
    const rows = await fetchReadings(req.userId, from, to);
    res.json({ type: 'monthly', date, month: label, from, to, ...stats(rows), readings: rows.map(serialize) });
  } catch (err) {
    console.error('monthly report failed', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { dailyReport, monthToDateReport, monthlyReport };
