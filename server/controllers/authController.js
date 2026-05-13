import bcrypt from "bcryptjs";
import jwt    from "jsonwebtoken";
import User   from "../models/User.js";

// ─── REGISTER ───────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    // Input already validated & sanitized by validateRegister middleware

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds — stronger than 10

    await User.create({
      username,
      email,
      password:  hashedPassword,
      favorites: [],
    });

    res.status(201).json({ message: "Account created successfully. Please log in." });

  } catch (error) {
    next(error); // Forwarded to global error handler
  }
};

// ─── LOGIN ──────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Input already validated & sanitized by validateLogin middleware

    // Must explicitly select password since schema has select: false
    const user = await User.findOne({ email }).select("+password");

    // Use the same vague message for both "not found" and "wrong password"
    // to prevent user enumeration attacks
    const INVALID_MSG = "Invalid email or password.";

    if (!user) {
      return res.status(401).json({ message: INVALID_MSG });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: INVALID_MSG });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
      },
    });

  } catch (error) {
    next(error);
  }
};