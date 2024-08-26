import express from "express";
import { getAllSchedules, uploadSchedule } from "../controllers/scheduleController.js";

const router = express.Router();

router.get("/all", getAllSchedules);
router.post("/upload", uploadSchedule);

export default router;