/* ============================================================
   ATMOS — MAIN CONTROLLER
   ============================================================ */

import {
  getWeather, getWeatherByCoords, getRecentSearches,
  loginUser, registerUser,
  addFavorite, removeFavorite, getFavorites,
  isLoggedIn, logoutUser,
} from "./api.js";

import {
  updateUI, updateBackground, renderFavorites,
  renderRecent, showToast, startClock, setUnit,
} from "./ui.js";

import { createChart, switchChartType } from "./chart.js";

// ─── STATE ──────────────────────────────────────────────────
let currentCity   = "";
let useFahrenheit = false;

// ─── ELEMENTS ───────────────────────────────────────────────
const loader           = document.getElementById("loader");
const searchInput      = document.getElementById("search-input");
const searchBtn        = document.getElementById("search-btn");
const locationBtn      = document.getElementById("location-btn");
const authModal        = document.getElementById("auth-modal");
const openAuthBtn      = document.getElementById("open-auth-btn");
const closeAuthBtn     = document.getElementById("close-auth-btn");
const favoriteBtn      = document.getElementById("favorite-btn");
const unitToggle       = document.getElementById("unit-toggle");
const unitLabel        = document.getElementById("unit-label");
// theme toggle removed
const userChip         = document.getElementById("user-chip");
const userAvatar       = document.getElementById("user-avatar");
const logoutBtn        = document.getElementById("logout-btn");
const modalContext     = document.getElementById("modal-context");
const modalContextText = document.getElementById("modal-context-text");
const emailInput       = document.getElementById("email");
const passwordInput    = document.getElementById("password");
const usernameInput    = document.getElementById("username");
const regEmail         = document.getElementById("reg-email");
const regPassword      = document.getElementById("reg-password");
const loginBtn         = document.getElementById("login-btn");
const registerBtn      = document.getElementById("register-btn");
const switchToRegister = document.getElementById("switch-to-register");
const switchToLogin    = document.getElementById("switch-to-login");

// ─── INIT ───────────────────────────────────────────────────
startClock();
updateAuthUI();

window.addEventListener("load", () => {
  setTimeout(() => loader.classList.add("hide"), 1200);
});

// On startup: try geolocation first, fall back to Delhi
detectAndLoadLocation();
loadFavorites();
loadRecentSearches();

// ─── GEOLOCATION ────────────────────────────────────────────

async function detectAndLoadLocation() {
  // Geolocation requires a secure context (HTTPS or localhost).
  // 127.0.0.1 is NOT treated as secure by all browsers — fall back gracefully.
  const isSecureContext =
    window.isSecureContext ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  if (!navigator.geolocation || !isSecureContext) {
    searchWeather("Delhi");
    return;
  }

  setLocationBtnState("loading");

  navigator.geolocation.getCurrentPosition(
    // ✅ Success — got coordinates
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        loader.classList.remove("hide");

        // ── Reverse geocode using OpenStreetMap Nominatim ──────
        // This gives us the proper city/district name instead of
        // a small suburb that WeatherAPI's coord lookup might return.
        let cityQuery = `${latitude},${longitude}`; // fallback: raw coords
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            // Pick the best available place name in priority order
            cityQuery =
              addr.city        ||
              addr.town        ||
              addr.municipality||
              addr.county      ||
              addr.state_district ||
              addr.state       ||
              cityQuery;
          }
        } catch (_) {
          // Nominatim failed — fall back to raw coords, no problem
        }

        const data = await getWeather(cityQuery);
        currentCity = data.location.name;
        updateUI(data);
        createChart(data);
        updateFavButton();
        await loadRecentSearches();
        setLocationBtnState("active");
        showToast(`📍 Showing weather for ${data.location.name}`, "success");
      } catch (err) {
        searchWeather("Delhi");
        setLocationBtnState("idle");
      } finally {
        loader.classList.add("hide");
      }
    },
    // ❌ Denied or error — fall back silently
    (err) => {
      setLocationBtnState("idle");
      if (err.code === err.PERMISSION_DENIED) {
        // User denied — silent fallback
        searchWeather("Delhi");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        showToast("Location unavailable, showing Delhi", "info");
        searchWeather("Delhi");
      } else {
        showToast("Location timed out, showing Delhi", "info");
        searchWeather("Delhi");
      }
    },
    { timeout: 8000, maximumAge: 300000 }
  );
}

function setLocationBtnState(state) {
  if (!locationBtn) return;
  locationBtn.classList.remove("loading", "active");
  if (state === "loading") {
    locationBtn.classList.add("loading");
    locationBtn.title = "Detecting location…";
    locationBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  } else if (state === "active") {
    locationBtn.classList.add("active");
    locationBtn.title = "Using your location";
    locationBtn.innerHTML = `<i class="fa-solid fa-location-dot"></i>`;
  } else {
    locationBtn.title = "Use my location";
    locationBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i>`;
  }
}

// Location button click — re-detect
locationBtn?.addEventListener("click", () => {
  detectAndLoadLocation();
});

// ─── AUTH UI STATE ──────────────────────────────────────────
function updateAuthUI() {
  if (isLoggedIn()) {
    openAuthBtn.style.display = "none";
    userChip.style.display = "flex";
    const name = localStorage.getItem("username") || "U";
    userAvatar.textContent = name.charAt(0).toUpperCase();
    userAvatar.title = name;
  } else {
    openAuthBtn.style.display = "flex";
    userChip.style.display = "none";
  }
}


// ─── UNIT TOGGLE ────────────────────────────────────────────
unitToggle.addEventListener("click", () => {
  useFahrenheit = !useFahrenheit;
  setUnit(useFahrenheit);
  unitLabel.textContent = useFahrenheit ? "°F" : "°C";
  if (currentCity) searchWeather(currentCity);
});

// ─── SEARCH ─────────────────────────────────────────────────
searchBtn.addEventListener("click", () => searchWeather());
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchWeather();
});

async function searchWeather(cityValue) {
  const city = cityValue || searchInput.value.trim();
  if (!city) return;
  currentCity = city;
  searchInput.value = "";

  // When user searches manually, deactivate location button
  setLocationBtnState("idle");

  loader.classList.remove("hide");
  try {
    const data = await getWeather(city);
    if (data) {
      updateUI(data);
      createChart(data);
      updateFavButton();
      await loadRecentSearches();
    }
  } catch (err) {
    showToast(`City "${city}" not found`, "error");
  } finally {
    loader.classList.add("hide");
  }
}

// ─── CHART TOGGLES ──────────────────────────────────────────
document.querySelectorAll(".chart-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chart-toggle").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    switchChartType(btn.dataset.type);
  });
});

// ─── MODAL HELPERS ──────────────────────────────────────────
function openModal(contextMessage = null) {
  if (contextMessage) {
    modalContextText.textContent = contextMessage;
    modalContext.style.display = "flex";
  } else {
    modalContext.style.display = "none";
  }
  authModal.classList.add("open");
}

function closeModal() {
  authModal.classList.remove("open");
  modalContext.style.display = "none";
}

function showTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.getElementById("login-form").classList.toggle("hidden", tab !== "login");
  document.getElementById("register-form").classList.toggle("hidden", tab !== "register");
}

openAuthBtn.addEventListener("click",  () => openModal());
closeAuthBtn.addEventListener("click", closeModal);
authModal.addEventListener("click",    (e) => { if (e.target === authModal) closeModal(); });

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => showTab(btn.dataset.tab));
});

switchToRegister?.addEventListener("click", (e) => { e.preventDefault(); showTab("register"); });
switchToLogin?.addEventListener("click",    (e) => { e.preventDefault(); showTab("login"); });

// ─── LOGIN ──────────────────────────────────────────────────
loginBtn.addEventListener("click", async () => {
  const email    = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) { showToast("Please fill all fields", "error"); return; }
  try {
    const data = await loginUser(email, password);
    if (data.token) {
      if (data.user?.username) localStorage.setItem("username", data.user.username);
      showToast("Welcome back! 👋", "success");
      closeModal();
      updateAuthUI();
      loadFavorites();
      loadRecentSearches();
    } else {
      showToast(data.message || "Login failed", "error");
    }
  } catch (err) {
    showToast(err.message || "Login failed", "error");
  }
});

// ─── REGISTER ───────────────────────────────────────────────
registerBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const email    = regEmail.value.trim();
  const password = regPassword.value.trim();
  if (!username || !email || !password) { showToast("Please fill all fields", "error"); return; }
  try {
    const data = await registerUser(username, email, password);
    showToast(data.message || "Account created! Please sign in.", "success");
    showTab("login");
  } catch (err) {
    showToast(err.message || "Registration failed", "error");
  }
});

// ─── LOGOUT ─────────────────────────────────────────────────
logoutBtn?.addEventListener("click", () => {
  logoutUser();
  localStorage.removeItem("username");
  updateAuthUI();
  showToast("Signed out", "info");
  renderFavorites([], () => {}, () => {});
  loadRecentSearches();
});

// ─── FAVORITES ──────────────────────────────────────────────
favoriteBtn.addEventListener("click", () => handleAddFavorite(currentCity));

async function handleAddFavorite(city) {
  if (!isLoggedIn()) {
    openModal(`Sign in to save "${city}" to your favourites`);
    return;
  }
  try {
    const data = await addFavorite(city);
    showToast(data.message || `${city} saved!`, "success");
    favoriteBtn.classList.add("active");
    loadFavorites();
  } catch (err) {
    showToast(err.message || "Could not save favourite", "error");
  }
}

async function handleRemoveFavorite(city) {
  try {
    await removeFavorite(city);
    showToast(`${city} removed`, "info");
    loadFavorites();
  } catch (err) {
    showToast(err.message || "Error removing favourite", "error");
  }
}

async function loadFavorites() {
  const favorites = await getFavorites();
  renderFavorites(favorites, (city) => searchWeather(city), handleRemoveFavorite);
}

function updateFavButton() { favoriteBtn.classList.remove("active"); }

// ─── RECENT SEARCHES ────────────────────────────────────────
async function loadRecentSearches() {
  const searches = await getRecentSearches();
  renderRecent(searches, (city) => searchWeather(city), isLoggedIn());
}

// ─── SIDEBAR NAVIGATION ─────────────────────────────────────
const sectionMap = {
  main:      ".hero-section",
  forecast:  ".forecast-panel",
  analytics: ".chart-panel",
  favorites: ".fav-panel",
};

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
    item.classList.add("active");
    const el = document.querySelector(sectionMap[item.dataset.section]);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ─── AUTO REFRESH every 10 minutes ──────────────────────────
setInterval(() => {
  if (currentCity) searchWeather(currentCity);
}, 10 * 60 * 1000);