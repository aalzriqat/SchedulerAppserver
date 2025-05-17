import express from "express";
import {
  getReceivedSwapRequestsToThisUser,
  createSwapRequest,
  updateSwapStatus,
  getSwapRequests,
  // getSwapRequestByUserId, // Removed, as function was deleted from controller
  // getSwapRequestByRequesterId, // Removed, as function was deleted from controller
  getSentSwapRequestsByThisUser,
  getApprovedSwapRequests,
  // cancelAllSwapRequests, // Removed as it's now an internal controller function
  getSwapRequestById, // Import for new route
  cancelSwapRequest // Import for new route
} from "../controllers/swapController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Import auth middleware
import { isAdmin } from "../controllers/usersController.js"; // Import isAdmin

const router = express.Router();

router.post("/request", authMiddleware, createSwapRequest);
router.put("/update/:swapId", authMiddleware, updateSwapStatus);
router.get("/swaps", authMiddleware, isAdmin, getSwapRequests); // Admin only to get all swaps
router.get("/me/received", authMiddleware, getReceivedSwapRequestsToThisUser); // User gets their received requests
router.get("/me/sent", authMiddleware, getSentSwapRequestsByThisUser); // User gets their sent requests
router.get("/id/:swapId", authMiddleware, getSwapRequestById); // Get specific swap by ID (auth in controller)
router.put("/:swapId/cancel", authMiddleware, cancelSwapRequest); // Cancel a swap request (auth in controller)
router.get("/swap/approved-requests", authMiddleware, isAdmin, getApprovedSwapRequests); // Admin only to get all approved swaps
export default router;
