/* ============================================================
   ATMOS — API LAYER
   ============================================================ */

// Auto-detect base URL:
// - On Render (same origin), use relative paths — no CORS issue at all
// - Locally, use localhost:5000
const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const BASE_URL = IS_LOCAL ? "http://localhost:5000" : "";

const WEATHER_URL   = `${BASE_URL}/api/weather`;
const AUTH_URL      = `${BASE_URL}/api/auth`;
const FAVORITES_URL = `${BASE_URL}/api/favorites`;

// ── Safe localStorage wrapper — some browsers block it ──────
const storage = {
  get(key) {
    try { return localStorage.getItem(key); }
    catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); return true; }
    catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); }
    catch {}
  },
};

function token() { return storage.get("token"); }

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.auth ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getWeather(city) {
  return request(`${WEATHER_URL}/${encodeURIComponent(city)}`, {
    auth: !!token(),
  });
}

export async function getWeatherByCoords(lat, lon) {
  return request(`${WEATHER_URL}/${encodeURIComponent(`${lat},${lon}`)}`, {
    auth: !!token(),
  });
}

export async function getRecentSearches() {
  return request(`${WEATHER_URL}/recent/searches`, {
    auth: !!token(),
  }).catch(() => []);
}

export async function registerUser(username, email, password) {
  return request(`${AUTH_URL}/register`, {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function loginUser(email, password) {
  const data = await request(`${AUTH_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.token) storage.set("token", data.token);
  return data;
}

export function logoutUser() { storage.remove("token"); }
export function isLoggedIn() { return !!token(); }

// Export storage so app.js can use it safely
export { storage };

export async function getFavorites() {
  if (!token()) return [];
  return request(FAVORITES_URL, { auth: true }).catch(() => []);
}

export async function addFavorite(city) {
  return request(`${FAVORITES_URL}/add`, {
    method: "POST", auth: true,
    body: JSON.stringify({ city }),
  });
}

export async function removeFavorite(city) {
  return request(`${FAVORITES_URL}/remove/${encodeURIComponent(city)}`, {
    method: "DELETE", auth: true,
  });
}