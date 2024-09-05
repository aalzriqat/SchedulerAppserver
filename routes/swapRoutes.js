import express from "express";
import {
  getReceivedSwapRequestsToThisUser,
  createSwapRequest,
  updateSwapStatus,
  getSwapRequests,
  getSwapRequestById,
  getSwapRequestByUserId,
  getSwapRequestByRequesterId,
  getSentSwapRequestsByThisUser,
  getApprovedSwapRequests,
  cancelAllSwapRequests
} from "../controllers/swapController.js";
const router = express.Router();

router.post("/request", createSwapRequest);
router.put("/update/:swapId", updateSwapStatus);
router.get("/swaps", getSwapRequests);
router.get("/received/:userId", getReceivedSwapRequestsToThisUser);
router.get("/sent/:userId", getSentSwapRequestsByThisUser);
router.get("/swap/approved-requests", getApprovedSwapRequests);
router.get("/swap/:swapId", getSwapRequestById);
router.get("/user/:userId", getSwapRequestByUserId);
router.get("/requester/:requesterId", getSwapRequestByRequesterId);
router.put("/cancel-all", cancelAllSwapRequests);
export default router;
