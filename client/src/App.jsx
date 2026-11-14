// Sweety — blood glucose tracker.
// Simple demo UI with a little warmth: sign up / log in, add up to 4 readings
// a day (one per time slot), see the day's readings, and view daily,
// month-to-date and monthly reports.
// The free demo server sleeps when idle, so every submit shows a loading
// state and a plain error if the server cannot be reached.
import { useEffect, useState } from 'react';
import { api } from './api.js';

const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];

// Browser-local date as YYYY-MM-DD (for the date pickers).
function localToday() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function loadSession() {
  try {
    const user = JSON.parse(localStorage.getItem('sweety_user') || 'null');
    const token = localStorage.getItem('sweety_token');
    return user && token ? { user, token } : null;
  } catch {
    return null;
  }
}

const styles = `
  body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: linear-gradient(160deg, #fff7f0, #ffeef2 55%, #fff7f0); color: #3a2a2e; min-height: 100vh; }
  main { max-width: 560px; margin: 0 auto; padding: 32px 20px 64px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .drop { width: 42px; height: 42px; flex: none; background: linear-gradient(160deg, #ff8a7a, #e75454); border-radius: 0 50% 50% 50%; transform: rotate(45deg); box-shadow: 0 4px 12px rgba(231, 84, 84, 0.35); }
  h1 { font-size: 32px; margin: 0; letter-spacing: -0.5px; }
  .tagline { margin: 4px 0 0; color: #8a6d6d; }
  .card { background: #fff; border-radius: 20px; padding: 22px; box-shadow: 0 8px 30px rgba(120, 60, 60, 0.08); margin-top: 18px; }
  h2 { font-size: 19px; margin: 0 0 12px; }
  label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
  input, select { width: 100%; padding: 11px 12px; margin-top: 5px; border: 1px solid #e8d5d5; border-radius: 10px; font-size: 16px; box-sizing: border-box; background: #fffdfb; color: #3a2a2e; }
  input:focus, select:focus { outline: 2px solid #ffb3b3; border-color: #ff8a8a; }
  button { font-family: inherit; }
  button.primary { width: 100%; padding: 12px; border: none; border-radius: 12px; background: linear-gradient(160deg, #ff8a7a, #e75454); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
  button.primary:disabled { opacity: 0.6; cursor: wait; }
  button.pill { background: transparent; border: 1px solid #e8d5d5; border-radius: 999px; padding: 7px 16px; font-size: 14px; cursor: pointer; color: #3a2a2e; }
  button.pill.active { background: #ffe3e3; border-color: #ffb3b3; font-weight: 600; }
  button.link { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 14px; padding: 2px 0; }
  .error { color: #c0392b; background: #fdecea; padding: 10px 12px; border-radius: 10px; }
  .ok { color: #1e7d32; background: #e8f5e9; padding: 10px 12px; border-radius: 10px; }
  .note { color: #8a6d6d; font-size: 13px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 2px; border-bottom: 1px solid #f3e3e3; }
  .row:last-child { border-bottom: none; }
  .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; }
  .stat { background: #fff7f0; border-radius: 12px; padding: 12px; text-align: center; }
  .stat span { font-size: 13px; color: #8a6d6d; }
  .stat b { font-size: 22px; display: block; margin-top: 2px; }
  .topbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
`;

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [date, setDate] = useState(localToday());
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [readings, setReadings] = useState([]);
  const [formError, setFormError] = useState('');
  const [formOk, setFormOk] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);

  const [reportType, setReportType] = useState('daily');
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');
  const [reportBusy, setReportBusy] = useState(false);

  async function loadReadings(forDate) {
    const res = await api(`/api/readings?date=${forDate}`);
    if (res.ok) setReadings(res.readings || []);
  }

  useEffect(() => {
    if (session) loadReadings(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function saveSession(user, token) {
    localStorage.setItem('sweety_user', JSON.stringify(user));
    localStorage.setItem('sweety_token', token);
    setSession({ user, token });
    setAuthError('');
  }

  function logout() {
    localStorage.removeItem('sweety_user');
    localStorage.removeItem('sweety_token');
    setSession(null);
    setReadings([]);
    setReport(null);
  }

  async function submitAuth(e) {
    e.preventDefault();
    if (authBusy) return;
    setAuthError('');
    setAuthBusy(true);
    try {
      const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register' ? { name, email, password } : { email, password };
      const res = await api(path, { method: 'POST', body: JSON.stringify(body) });
      if (res.ok && res.token) {
        saveSession(res.user, res.token);
      } else {
        setAuthError(res.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitReading(e) {
    e.preventDefault();
    if (saveBusy) return;
    setFormError('');
    setFormOk('');
    setSaveBusy(true);
    try {
      const res = await api('/api/readings', {
        method: 'POST',
        body: JSON.stringify({ reading_date: date, time_slot: slot, value: value === '' ? '' : Number(value) }),
      });
      if (res.ok) {
        setValue('');
        setFormOk('Reading saved.');
        loadReadings(date);
      } else {
        setFormError(res.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setSaveBusy(false);
    }
  }

  async function removeReading(id) {
    const res = await api(`/api/readings/${id}`, { method: 'DELETE' });
    if (res.ok) loadReadings(date);
  }

  async function loadReport(type) {
    if (reportBusy) return;
    setReportType(type);
    setReportError('');
    setReport(null);
    setReportBusy(true);
    try {
      const res = await api(`/api/reports/${type}?date=${date}`);
      if (res.ok) setReport(res);
      else setReportError(res.error || 'Something went wrong. Please try again.');
    } finally {
      setReportBusy(false);
    }
  }

  function changeDate(next) {
    setDate(next);
    setReport(null);
    loadReadings(next);
  }

  if (!session) {
    return (
      <main>
        <style>{styles}</style>
        <div className="brand">
          <div className="drop" />
          <div>
            <h1>Sweety</h1>
            <p className="tagline">Blood glucose tracker — small numbers, big picture.</p>
          </div>
        </div>
        <div className="card">
          <p>
            <button className={`pill${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>Log in</button>{' '}
            <button className={`pill${mode === 'register' ? ' active' : ''}`} onClick={() => setMode('register')}>Sign up</button>
          </p>
          <form onSubmit={submitAuth}>
            {mode === 'register' && (
              <label>Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            )}
            <label>Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {authError && <p className="error">{authError}</p>}
            <button className="primary" type="submit" disabled={authBusy}>
              {authBusy ? (mode === 'register' ? 'Creating account…' : 'Logging in…') : (mode === 'register' ? 'Create account' : 'Log in')}
            </button>
          </form>
          <p className="note">Demo tip: log in with demo@sweety.app / Demo1234 to see sample readings. First sign-in can take up to a minute — the free demo server sleeps when nobody is using it.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <style>{styles}</style>
      <div className="brand">
        <div className="drop" />
        <div>
          <h1>Sweety</h1>
          <p className="tagline">Hello, {session.user.name}.</p>
        </div>
      </div>
      <p className="topbar">
        <span className="note">{session.user.email}</span>
        <button className="pill" onClick={logout}>Log out</button>
      </p>

      <div className="card">
        <h2>Add a reading</h2>
        <form onSubmit={submitReading}>
          <label>Date
            <input type="date" value={date} max={localToday()} onChange={(e) => changeDate(e.target.value)} required />
          </label>
          <label>Time slot
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>Glucose value (mg/dl)
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 110" required />
          </label>
          {formError && <p className="error">{formError}</p>}
          {formOk && <p className="ok">{formOk}</p>}
          <button className="primary" type="submit" disabled={saveBusy}>
            {saveBusy ? 'Saving…' : 'Save reading'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Readings for {date}</h2>
        {readings.length === 0 ? (
          <p className="note">No readings yet for this date.</p>
        ) : (
          readings.map((r) => (
            <div className="row" key={r.id}>
              <span>{r.time_slot}: <strong>{r.value} mg/dl</strong></span>
              <button className="link" onClick={() => removeReading(r.id)}>Delete</button>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Reports</h2>
        <p>
          <button className={`pill${reportType === 'daily' ? ' active' : ''}`} onClick={() => loadReport('daily')}>Daily</button>{' '}
          <button className={`pill${reportType === 'month-to-date' ? ' active' : ''}`} onClick={() => loadReport('month-to-date')}>Month-to-date</button>{' '}
          <button className={`pill${reportType === 'monthly' ? ' active' : ''}`} onClick={() => loadReport('monthly')}>Monthly</button>
        </p>
        {reportBusy && <p className="note">Loading report…</p>}
        {reportError && <p className="error">{reportError}</p>}
        {report && (
          <div>
            <p>
              {report.type === 'daily' && `Daily report — ${report.date}`}
              {report.type === 'month-to-date' && `Month-to-date — ${report.from} to ${report.to}`}
              {report.type === 'monthly' && `Monthly report — ${report.month}`}
            </p>
            {report.count === 0 ? (
              <p className="note">No readings in this period yet.</p>
            ) : (
              <div className="stat-grid">
                <div className="stat"><span>Readings</span><b>{report.count}</b></div>
                <div className="stat"><span>Highest</span><b>{report.highest}</b></div>
                <div className="stat"><span>Lowest</span><b>{report.lowest}</b></div>
                <div className="stat"><span>Average</span><b>{report.average}</b></div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
