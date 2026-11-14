// Small helper for talking to the Sweety API.
// The API address comes from VITE_API_URL in the .env file.
// The login token is kept in localStorage and sent as a Bearer token.
const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('sweety_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
      ...options,
    });
  } catch (err) {
    // Network failure — the free demo server sleeps when idle, so the first
    // request after a while can fail while it wakes up. Say so plainly
    // instead of failing silently.
    return { status: 0, ok: false, error: 'Could not reach the server. It may be waking up — please try again in a few seconds.' };
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, ...data };
}

export { API_URL };
