import express from "express";
import {
  getAllSchedules,
  uploadSchedule,
  getAvailableSchedules,
  getSchedulesByEmployeeId,
  updateShiftAvailabilityController,
  getFilteredAvailableSchedules // Import the new controller function
} from "../controllers/scheduleController.js";
import { auth } from "../controllers/usersController.js";

const router = express.Router();

router.get("/all", getAllSchedules);
router.post("/upload", uploadSchedule);
router.post('/available-schedules', getAvailableSchedules);
router.get("/employee/:employeeId", auth, getSchedulesByEmployeeId);
router.patch("/:scheduleId/availability", auth, updateShiftAvailabilityController);

// New route for fetching filtered available schedules for swap
router.get("/available-for-swap-filtered", auth, getFilteredAvailableSchedules);

export default router;