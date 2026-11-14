// Sweety — blood glucose tracker (steps 2–4).
// Simple UI: sign up / log in, add up to 4 readings a day (one per time slot),
// see the day's readings, and view daily, month-to-date and monthly reports.
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

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [date, setDate] = useState(localToday());
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [readings, setReadings] = useState([]);
  const [formError, setFormError] = useState('');
  const [formOk, setFormOk] = useState('');

  const [reportType, setReportType] = useState('daily');
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');

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
    setAuthError('');
    const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = mode === 'register' ? { name, email, password } : { email, password };
    const res = await api(path, { method: 'POST', body: JSON.stringify(body) });
    if (res.ok && res.token) {
      saveSession(res.user, res.token);
    } else {
      setAuthError(res.error || 'Something went wrong. Please try again.');
    }
  }

  async function submitReading(e) {
    e.preventDefault();
    setFormError('');
    setFormOk('');
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
  }

  async function removeReading(id) {
    const res = await api(`/api/readings/${id}`, { method: 'DELETE' });
    if (res.ok) loadReadings(date);
  }

  async function loadReport(type) {
    setReportType(type);
    setReportError('');
    setReport(null);
    const res = await api(`/api/reports/${type}?date=${date}`);
    if (res.ok) setReport(res);
    else setReportError(res.error || 'Something went wrong. Please try again.');
  }

  function changeDate(next) {
    setDate(next);
    setReport(null);
    loadReadings(next);
  }

  if (!session) {
    return (
      <main>
        <h1>Sweety</h1>
        <p>Blood glucose tracker — log in to record your readings.</p>
        <div>
          <button onClick={() => setMode('login')} disabled={mode === 'login'}>Log in</button>{' '}
          <button onClick={() => setMode('register')} disabled={mode === 'register'}>Sign up</button>
        </div>
        <form onSubmit={submitAuth}>
          {mode === 'register' && (
            <p>
              <label>Name<br />
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            </p>
          )}
          <p>
            <label>Email<br />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
          </p>
          <p>
            <label>Password<br />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
          </p>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
          <button type="submit">{mode === 'register' ? 'Create account' : 'Log in'}</button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>Sweety</h1>
      <p>
        Hello, {session.user.name} ({session.user.email}){' '}
        <button onClick={logout}>Log out</button>
      </p>

      <h2>Add a reading</h2>
      <form onSubmit={submitReading}>
        <p>
          <label>Date<br />
            <input type="date" value={date} max={localToday()} onChange={(e) => changeDate(e.target.value)} required />
          </label>
        </p>
        <p>
          <label>Time slot<br />
            <select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </p>
        <p>
          <label>Glucose value (mg/dl)<br />
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 110" required />
          </label>
        </p>
        {formError && <p style={{ color: 'red' }}>{formError}</p>}
        {formOk && <p style={{ color: 'green' }}>{formOk}</p>}
        <button type="submit">Save reading</button>
      </form>

      <h2>Readings for {date}</h2>
      {readings.length === 0 ? (
        <p>No readings yet for this date.</p>
      ) : (
        <ul>
          {readings.map((r) => (
            <li key={r.id}>
              {r.time_slot}: <strong>{r.value} mg/dl</strong>{' '}
              <button onClick={() => removeReading(r.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <h2>Reports</h2>
      <p>
        <button onClick={() => loadReport('daily')}>Daily</button>{' '}
        <button onClick={() => loadReport('month-to-date')}>Month-to-date</button>{' '}
        <button onClick={() => loadReport('monthly')}>Monthly</button>
      </p>
      {reportError && <p style={{ color: 'red' }}>{reportError}</p>}
      {report && (
        <div>
          <p>
            {report.type === 'daily' && `Daily report — ${report.date}`}
            {report.type === 'month-to-date' && `Month-to-date — ${report.from} to ${report.to}`}
            {report.type === 'monthly' && `Monthly report — ${report.month}`}
          </p>
          {report.count === 0 ? (
            <p>No readings in this period yet.</p>
          ) : (
            <ul>
              <li>Readings: {report.count}</li>
              <li>Highest: {report.highest} mg/dl</li>
              <li>Lowest: {report.lowest} mg/dl</li>
              <li>Average: {report.average} mg/dl</li>
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
