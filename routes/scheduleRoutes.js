import express from "express";
import { getAllSchedules, uploadSchedule,getAvailableSchedules } from "../controllers/scheduleController.js";

const router = express.Router();

router.get("/all", getAllSchedules);
router.post("/upload", uploadSchedule);
router.post('/available-schedules', getAvailableSchedules);

export default router;