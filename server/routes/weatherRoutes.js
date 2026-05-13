import express                            from "express";
import { getWeather, getRecentSearches } from "../controllers/weatherController.js";
import { validateCity }                  from "../middleware/Validate.js";
import { optionalAuth }                  from "../middleware/authMiddleware.js";

const router = express.Router();

// Both routes use optionalAuth — works for guests AND logged-in users.
// /recent/searches MUST be defined before /:city so Express
// doesn't match "recent" as a city param.
router.get("/recent/searches", optionalAuth, getRecentSearches);
router.get("/:city",           optionalAuth, validateCity, getWeather);

export default router;