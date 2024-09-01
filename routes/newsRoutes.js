import express from "express";
import {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} from "../controllers/newsController.js";

const router = express.Router();

// Get all news
router.get("/", getAllNews);

// Get a single news item by ID
router.get("/:id", getNewsById);

// Create a new news item
router.post("/", createNews);

// Update a news item by ID
router.put("/:id", updateNews);

// Delete a news item by ID
router.delete("/:id", deleteNews);

export default router;