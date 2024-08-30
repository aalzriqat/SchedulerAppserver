import express from 'express';
import {
  createLeaveRequest,
  getAllLeaveRequests,
  getUserLeaveRequestsById,
  updateLeaveRequest,
  deleteLeaveRequest,
} from '../controllers/leavePlannerController.js';

const router = express.Router();

// Create a leave request
router.post("/create", createLeaveRequest);

// Get all leave requests
router.get("/all", getAllLeaveRequests);

// Get leave requests of a user
router.get("/user/:id", getUserLeaveRequestsById);

// Update a leave request
router.put("/update", updateLeaveRequest);

// Delete a leave request
router.delete("/delete", deleteLeaveRequest);

export default router;