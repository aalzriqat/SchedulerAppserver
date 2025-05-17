import express from "express";
import {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} from "../controllers/newsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isAdmin } from "../controllers/usersController.js";

const router = express.Router();

// Get all news - Public
router.get("/", getAllNews);

// Get a single news item by ID - Public
router.get("/:id", getNewsById);

// Create a new news item - Admin only
router.post("/", authMiddleware, isAdmin, createNews);

// Update a news item by ID - Admin only
router.put("/:id", authMiddleware, isAdmin, updateNews);

// Delete a news item by ID - Admin only
router.delete("/:id", authMiddleware, isAdmin, deleteNews);

export default router;