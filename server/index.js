// Sweety server — skeleton only (step 1).
// Loads config, connects to PostgreSQL, exposes a health check.
// Auth, readings and reports come in later steps.
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const pool = require('./db');

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sweety server running on port ${PORT}`);
});
