import express from "express";
import {
  getAllSchedules,
  uploadSchedule,
  getAvailableSchedules,
  getSchedulesByEmployeeId,
  updateShiftAvailabilityController,
  getFilteredAvailableSchedules // Import the new controller function
} from "../controllers/scheduleController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Corrected import
import { isAdmin } from "../controllers/usersController.js"; // Import isAdmin

const router = express.Router();

router.get("/all", authMiddleware, getAllSchedules);
router.post("/upload", authMiddleware, isAdmin, uploadSchedule);
router.post('/available-schedules', authMiddleware, getAvailableSchedules);
router.get("/employee/:employeeId", authMiddleware, getSchedulesByEmployeeId); // Authorization is handled in controller
router.patch("/:scheduleId/availability", authMiddleware, updateShiftAvailabilityController);

// New route for fetching filtered available schedules for swap
router.get("/available-for-swap-filtered", authMiddleware, getFilteredAvailableSchedules);

export default router;