// Small helper for talking to the Sweety API.
// The API address comes from VITE_API_URL in the .env file.
// The login token is kept in localStorage and sent as a Bearer token.
const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem('sweety_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, ...data };
}

export { API_URL };
