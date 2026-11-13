// Small helper for talking to the Sweety API.
// The API address comes from VITE_API_URL in the .env file.
// No endpoints are called yet — login, readings and reports use this later.
const API_URL = import.meta.env.VITE_API_URL;

export async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  return res.json();
}

export { API_URL };
