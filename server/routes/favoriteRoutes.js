import express from "express";

import {
    addFavorite,
    getFavorites,
    removeFavorite
}
from "../controllers/favoriteController.js";

import { protect as authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();



// ======================
// ROUTES
// ======================

router.post(
    "/add",
    authMiddleware,
    addFavorite
);

router.get(
    "/",
    authMiddleware,
    getFavorites
);

router.delete(
    "/remove/:city",
    authMiddleware,
    removeFavorite
);

export default router;