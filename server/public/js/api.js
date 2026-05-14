/* ============================================================
   ATMOS — API LAYER
   ============================================================ */

const WEATHER_URL   = "https://atmos-backend.onrender.com/api/weather";
const AUTH_URL      = "https://atmos-backend.onrender.com/api/auth";
const FAVORITES_URL = "https://atmos-backend.onrender.com/api/favorites";

function token() { return localStorage.getItem("token"); }

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
  if (data.token) localStorage.setItem("token", data.token);
  return data;
}

export function logoutUser() { localStorage.removeItem("token"); }
export function isLoggedIn() { return !!token(); }

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