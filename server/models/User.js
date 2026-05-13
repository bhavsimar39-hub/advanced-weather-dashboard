import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, "Username is required"],
      trim:      true,
      minlength: [2,  "Username must be at least 2 characters"],
      maxlength: [32, "Username must be at most 32 characters"],
    },

    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },

    password: {
      type:      String,
      required:  [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select:    false, // Never returned in queries by default
    },

    favorites: {
      type:    [String],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Compound index for fast email lookups (unique already creates one, this makes it explicit)
userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);
export default User;