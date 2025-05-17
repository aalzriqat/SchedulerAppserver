import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js'; // Import the auth middleware
import { isAdmin } from '../controllers/usersController.js'; // Import isAdmin
import {
  createLeaveRequest,
  getAllLeaveRequests,
  getUserLeaveRequestsById, // This will be adapted for /me route
  updateLeaveRequest,
  deleteLeaveRequest,
} from '../controllers/leavePlannerController.js';

const router = express.Router();

// Create a leave request - Protected
router.post("/create", authMiddleware, createLeaveRequest);

// Get all leave requests - Admin only
router.get("/all", authMiddleware, isAdmin, getAllLeaveRequests);

// Get leave requests of the authenticated user
// The controller getUserLeaveRequestsById will be adapted to use req.user.id
router.get("/me", authMiddleware, getUserLeaveRequestsById);

// If admin needs to get by specific user ID, a new route can be added:
// router.get("/user/:userId", authMiddleware, isAdmin, getUserLeaveRequestsById);


// Update a leave request - Protected
router.put("/update", authMiddleware, updateLeaveRequest); // ID is in body

// Delete a leave request - Protected
router.delete("/delete/:leaveRequestId", authMiddleware, deleteLeaveRequest);

export default router;