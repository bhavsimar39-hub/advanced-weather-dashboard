import axios         from "axios";
import SearchHistory from "../models/SearchHistory.js";

const WEATHER_BASE = "https://api.weatherapi.com/v1/forecast.json";

// ─── GET WEATHER + SAVE SEARCH ──────────────────────────────
export const getWeather = async (req, res, next) => {
  try {
    const city   = req.params.city;
    const apiKey = process.env.WEATHER_API_KEY;

    const response = await axios.get(WEATHER_BASE, {
      params: { key: apiKey, q: city, days: 7, aqi: "yes", alerts: "yes" },
      timeout: 8000,
    });

    const data           = response.data;
    const cityNormalized = data.location.name.toLowerCase();

    // userId is set by optionalAuth middleware — null for guests
    const userId = req.user?.id || null;

    // Upsert: one record per user+city (or one global record per city for guests)
    await SearchHistory.findOneAndUpdate(
      { userId, cityNormalized },
      {
        $set: {
          city:          data.location.name,
          cityNormalized,
          country:       data.location.country,
          temperature:   data.current.temp_c,
          condition:     data.current.condition.text,
          icon:          data.current.condition.icon,
          searchedAt:    new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json(data);

  } catch (error) {
    if (error.response?.status === 400) {
      return res.status(404).json({ message: "City not found. Please check the name and try again." });
    }
    if (error.response?.status === 403) {
      return res.status(500).json({ message: "Weather service configuration error." });
    }
    next(error);
  }
};

// ─── RECENT SEARCHES ────────────────────────────────────────
// Returns the current user's searches if logged in,
// otherwise returns nothing (guests don't have history).
export const getRecentSearches = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;

    // Guest: return empty array — history is a logged-in feature
    if (!userId) {
      return res.status(200).json([]);
    }

    const searches = await SearchHistory
      .find({ userId })
      .sort({ searchedAt: -1 })
      .limit(8)
      .select("city country temperature condition icon searchedAt -_id");

    res.status(200).json(searches);

  } catch (error) {
    next(error);
  }
};