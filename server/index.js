// Sweety server.
// Loads config, connects to PostgreSQL, exposes a health check.
// Auth (step 2), readings (step 3) and reports (step 4) live in their own modules.
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { register, login, requireAuth } = require('./auth');
const { addReading, listReadings, deleteReading } = require('./readings');
const { dailyReport, monthToDateReport, monthlyReport } = require('./reports');

const app = express();
app.use(cors());
app.use(express.json());

// Health check: confirms the server is up and the database answers.
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'unreachable' });
  }
});

app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

app.get('/api/readings', requireAuth, listReadings);
app.post('/api/readings', requireAuth, addReading);
app.delete('/api/readings/:id', requireAuth, deleteReading);

app.get('/api/reports/daily', requireAuth, dailyReport);
app.get('/api/reports/month-to-date', requireAuth, monthToDateReport);
app.get('/api/reports/monthly', requireAuth, monthlyReport);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sweety server running on port ${PORT}`);
});
