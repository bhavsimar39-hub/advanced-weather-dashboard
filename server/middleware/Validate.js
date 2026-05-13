// ─── CITY ────────────────────────────────────────────────────
export const validateCity = (req, res, next) => {
  const city = req.params.city || "";
  const sanitized = city.replace(/[${}[\]]/g, "").trim();
  if (!sanitized) return res.status(400).json({ message: "City name is required." });
  if (sanitized.length > 100) return res.status(400).json({ message: "City name is too long." });
  req.params.city = sanitized;
  next();
};

// ─── REGISTER ────────────────────────────────────────────────
export const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (username.trim().length < 2) {
    return res.status(400).json({ message: "Username must be at least 2 characters." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  // Sanitize
  req.body.username = username.trim();
  req.body.email    = email.trim().toLowerCase();
  next();
};

// ─── LOGIN ───────────────────────────────────────────────────
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};