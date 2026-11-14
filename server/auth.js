// Sweety auth — register + login (step 2).
// Passwords are bcrypt-hashed, never stored in plain text.
// After login the client sends the JWT as `Authorization: Bearer <token>`
// and only ever sees that user's own readings.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;

function signToken(userId) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );
    const user = publicUser(result.rows[0]);
    res.status(201).json({ user, token: signToken(user.id) });
  } catch (err) {
    console.error('register failed', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Please enter your email and password.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });
    res.json({ user: publicUser(user), token: signToken(user.id) });
  } catch (err) {
    console.error('login failed', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Please log in again.' });
  }
}

module.exports = { register, login, requireAuth };
