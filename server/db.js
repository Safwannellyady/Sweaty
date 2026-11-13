// Database connection pool.
// Reads DATABASE_URL from the .env file at the project root.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
