import jwt from "jsonwebtoken";

// ── REQUIRED AUTH ────────────────────────────────────────────
// Blocks the request if no valid token is present.
// Use on protected routes (favorites, etc.)
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorised. Please sign in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired. Please sign in again." });
  }
};

// ── OPTIONAL AUTH ────────────────────────────────────────────
// Attaches req.user if a valid token is present, but never blocks
// the request. Use on routes that work for both guests and users.
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Invalid token — treat as guest, don't block
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};