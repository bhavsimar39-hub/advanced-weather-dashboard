# 🌤️ Atmos — Weather Intelligence Dashboard

> A full-stack, real-time weather intelligence web application with beautiful dynamic backgrounds, live forecasts, analytics, and personalised lifestyle tips.

---

## 📸 Overview

**Atmos** is a premium weather dashboard that combines real-time weather data with a polished, responsive UI. It features dynamic weather-aware gradient backgrounds, animated canvas effects, user authentication, saved favourites, and AI-style lifestyle recommendations — all in a single-page application.

---

## ✨ Features

### 🌍 Weather Data
- **Real-time weather** for any city worldwide via search
- **Auto location detection** using the browser Geolocation API — loads your city on startup
- **Current conditions** — temperature, feels like, humidity, wind speed & direction, pressure, visibility, air quality (PM2.5)
- **7-Day forecast** with daily high/low temperatures and condition icons
- **Hourly forecast** — 24-hour scrollable strip with temperature and rain chance
- **Sun & UV panel** — animated sun arc showing current solar position, sunrise/sunset times, UV index bar

### 🎨 Dynamic Backgrounds
- **Weather-aware CSS gradient backgrounds** — each condition (sunny, rain, thunder, snow, fog, cloudy, clear night) has its own colour palette
- **Day/Night detection** — clear day shows a warm blue-gold sky; clear night shows a deep navy gradient
- **Canvas animation engine** — layered particle effects on top of gradients:
  - 🌧️ Rain streaks (light and heavy)
  - ⚡ Thunder with jagged lightning bolts and flash effects
  - ❄️ Snowfall with drifting flakes (standard and blizzard)
  - 🌫️ Fog with drifting mist layers
  - ☁️ Animated cloud formations
  - ☀️ Glowing sun rays
  - 🌙 Twinkling stars for clear nights
- **Weather-aware hero tints** — the hero panel border and vignette shift colour to match the weather mood (amber for sunny, purple-black for thunder, icy blue for snow, etc.)

### 📊 Analytics
- **Temperature Trend chart** — smooth line chart with gradient fill
- **Rain Chance chart** — 7-day precipitation probability
- **Humidity chart** — week-long humidity levels
- Toggle between chart types with animated transitions
- Built with **Chart.js** with custom dark theme styling

### 💡 Lifestyle Tips
- **5 personalised tip cards** generated from live weather data:
  - 👕 **What to Wear** — clothing suggestions based on temperature, rain, UV
  - 🏃 **Outdoor Activity** — safe activity levels and best times of day
  - 🏥 **Health & Wellness** — hydration, AQI warnings, heat/cold risk
  - 🚗 **Travel & Commute** — road safety, visibility, wind alerts
  - 🍽️ **Food & Drink** — meal and drink suggestions matched to conditions
- Tips auto-update on every city search
- Extreme conditions (thunderstorm, very high heat, blizzard, poor air) show safety warnings

### 🔐 Authentication
- **User registration and login** with JWT-based sessions
- **Secure password hashing** with bcrypt (12 rounds)
- Protected routes with Bearer token authentication
- Optional auth middleware — weather works for guests, history/favourites require login
- Anti-enumeration: same error message for wrong email or wrong password
- Rate limiting on auth routes (10 requests / 15 minutes)

### ❤️ Favourites & History
- **Save favourite cities** (up to 20 per user) — persisted to MongoDB
- **Quick access** — click any favourite to instantly load its weather
- **Search history** — last 8 searches stored per user, shown in the Recent panel
- Case-insensitive duplicate detection for favourites

### 🔒 Security
- **Helmet.js** — HTTP security headers, custom Content-Security-Policy
- **CORS** configured for specific client origin
- **Rate limiting** — global API limiter (200 req/15 min), weather limiter (30 req/min), auth limiter (10 req/15 min)
- **Input validation & sanitisation** middleware on all routes
- **Global error handler** — normalises Mongoose, JWT, and duplicate key errors
- Request body size limit (10kb)
- MongoDB injection characters stripped from city names

### 🎛️ UI / UX
- **°C / °F unit toggle** — all temperatures update instantly
- **Live clock** — real-time HH:MM display with full date
- **Search history suggestions** in the Recent Searches panel
- **Toast notifications** — success, error, info toasts with auto-dismiss
- **Animated loader** with spinning rings on app startup
- **Auth modal** — split-panel design with brand panel and form panel; context-aware (e.g. "Sign in to save Delhi")
- **Smooth scroll navigation** — sidebar and mobile nav scroll to sections

### 📱 Responsive Design
- **Desktop (>1100px)** — full sidebar, 6-column stats grid, twin-row layout
- **Tablet (≤1100px)** — sidebar collapses to 68px icon-only strip
- **Mobile (≤768px)** — sidebar hidden, replaced by fixed **bottom navigation bar** with Home / Forecast / Analytics / Favorites / Account tabs
- **Small mobile (≤420px)** — single-column lifestyle tips, compact stats, reduced font sizes
- Safe-area inset support for iPhone notches (`env(safe-area-inset-bottom)`)
- Horizontal scroll on hourly forecast and (optional) lifestyle cards

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Vanilla JavaScript (ES Modules)** | App logic, API calls, UI rendering |
| **HTML5** | Semantic page structure |
| **CSS3** | Styling, animations, responsive layout |
| **Canvas API** | Weather particle animations (rain, snow, lightning, fog, stars) |
| **Chart.js** | Temperature, rain, and humidity trend charts |
| **Font Awesome 6** | Icons throughout the UI |
| **Google Fonts** | Syne (headings), DM Mono (numbers), DM Sans (body) |
| **CSS Custom Properties** | Theming system (dark/light mode, weather accents) |
| **CSS Grid & Flexbox** | Responsive layout system |
| **Geolocation API** | Auto-detect user location on load |
| **LocalStorage** | JWT token and username persistence |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js** | HTTP server and routing |
| **MongoDB** | Database for users, favourites, search history |
| **Mongoose** | ODM for MongoDB schema and queries |
| **JWT (jsonwebtoken)** | Stateless authentication tokens |
| **bcryptjs** | Password hashing (12 salt rounds) |
| **Axios** | HTTP client for WeatherAPI requests |
| **Helmet.js** | Security headers middleware |
| **CORS** | Cross-origin resource sharing |
| **express-rate-limit** | API rate limiting |
| **Morgan** | HTTP request logging |
| **dotenv** | Environment variable management |

### External APIs
| API | Purpose |
|---|---|
| **WeatherAPI.com** | Real-time weather, 7-day forecast, hourly data, AQI, UV index |

---

## 📁 Project Structure

```
atmos/
├── frontend/
│   ├── index.html          # Main HTML, layout, modals, mobile nav
│   ├── css/
│   │   └── style.css       # All styles, themes, animations, responsive
│   └── js/
│       ├── app.js          # Main controller — events, auth, search
│       ├── api.js          # API layer — fetch wrappers for all endpoints
│       ├── ui.js           # UI rendering, canvas animations, backgrounds
│       └── chart.js        # Chart.js integration and data mapping
│
└── backend/
    ├── server.js           # Express app setup, middleware, startup
    ├── config/
    │   └── db.js           # MongoDB connection with retry logic
    ├── models/
    │   ├── User.js         # User schema (username, email, password, favourites)
    │   └── SearchHistory.js # Search history schema (userId, city, condition)
    ├── controllers/
    │   ├── authController.js     # Register and login logic
    │   ├── weatherController.js  # Fetch weather + save search history
    │   └── favoriteController.js # Add, get, remove favourites
    ├── routes/
    │   ├── authRoutes.js         # POST /api/auth/register, /login
    │   ├── weatherRoutes.js      # GET /api/weather/:city, /recent/searches
    │   └── favoriteRoutes.js     # GET/POST/DELETE /api/favorites
    └── middleware/
        ├── authMiddleware.js     # protect (required) + optionalAuth
        ├── Validate.js           # Input validation for city, register, login
        ├── globalError.js        # Centralised error handler
        └── ratelimiter.js        # API, auth, and weather rate limiters
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- WeatherAPI.com API key (free tier works)

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/atmos
JWT_SECRET=your_super_secret_key_here
WEATHER_API_KEY=your_weatherapi_key_here
CLIENT_ORIGIN=http://localhost:5500
NODE_ENV=development
```

Start the server:
```bash
node server.js
```

### Frontend Setup
Open `frontend/index.html` with **Live Server** (VS Code extension) on port 5500, or any static file server.

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Create new account |
| `POST` | `/api/auth/login` | None | Login, returns JWT |
| `GET` | `/api/weather/:city` | Optional | Get weather data, save history |
| `GET` | `/api/weather/recent/searches` | Optional | Get last 8 searches |
| `GET` | `/api/favorites` | Required | Get user's saved cities |
| `POST` | `/api/favorites/add` | Required | Add city to favourites |
| `DELETE` | `/api/favorites/remove/:city` | Required | Remove city from favourites |
| `GET` | `/health` | None | Server health check |

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `WEATHER_API_KEY` | WeatherAPI.com API key |
| `CLIENT_ORIGIN` | Allowed CORS origin (your frontend URL) |
| `NODE_ENV` | `development` or `production` |

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ — Atmos Weather Intelligence*
