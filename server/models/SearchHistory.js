import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    // Optional — null means anonymous/guest search
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    city:           { type: String, required: true },
    cityNormalized: { type: String, required: true },
    country:        { type: String },
    temperature:    { type: Number },
    condition:      { type: String },
    icon:           { type: String },
    searchedAt:     { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Unique per user+city combination so one user can't have duplicate entries
searchHistorySchema.index({ userId: 1, cityNormalized: 1 }, { unique: true });

export default mongoose.model("SearchHistory", searchHistorySchema);