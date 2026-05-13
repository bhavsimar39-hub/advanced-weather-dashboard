import User from "../models/User.js";

// ─── ADD FAVORITE ────────────────────────────────────────────
export const addFavorite = async (req, res, next) => {
  try {
    const city = req.body.city; // Already validated & trimmed by validateCity middleware

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Case-insensitive duplicate check
    const alreadySaved = user.favorites.some(
      (f) => f.toLowerCase() === city.toLowerCase()
    );

    if (alreadySaved) {
      return res.status(409).json({ message: `${city} is already in your favorites.` });
    }

    if (user.favorites.length >= 20) {
      return res.status(400).json({ message: "Favorites limit reached (20 cities max)." });
    }

    user.favorites.push(city);
    await user.save();

    res.status(200).json({
      message:   `${city} added to favorites.`,
      favorites: user.favorites,
    });

  } catch (error) {
    next(error);
  }
};

// ─── GET FAVORITES ───────────────────────────────────────────
export const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("favorites");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user.favorites);

  } catch (error) {
    next(error);
  }
};

// ─── REMOVE FAVORITE ─────────────────────────────────────────
export const removeFavorite = async (req, res, next) => {
  try {
    const city = req.params.city.trim();

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const originalLength = user.favorites.length;

    // Case-insensitive removal
    user.favorites = user.favorites.filter(
      (f) => f.toLowerCase() !== city.toLowerCase()
    );

    if (user.favorites.length === originalLength) {
      return res.status(404).json({ message: `${city} was not in your favorites.` });
    }

    await user.save();

    res.status(200).json({
      message:   `${city} removed from favorites.`,
      favorites: user.favorites,
    });

  } catch (error) {
    next(error);
  }
};