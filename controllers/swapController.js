import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import SwapRequest from "../models/SwapRequest.js";
import { io } from '../server.js'; // Import the io instance

// Helper function for validation
const validateSwapRequest = (swapId, status, role, adminStatus) => {
  if (!isValidObjectId(swapId)) {
    return 'Invalid swap request ID';
  }
  if (!['accepted', 'rejected', 'pending', 'approved', 'declined'].includes(status)) {
    return 'Invalid status value';
  }
  if (!['admin', 'employee'].includes(role)) {
    return 'Invalid role value';
  }
  if (role === 'admin' && !['approved', 'declined', 'pending'].includes(adminStatus)) {
    return 'Invalid adminStatus value';
  }
  return null;
};

// Helper function for error response
const handleErrorResponse = (res, error, statusCode = 500) => {
  console.error(error);
  let errorMessage = error.message || error;

  // Custom error messages
  if (error.code === 11000) {
    errorMessage = "You have previously requested a swap with this user.";
  }

  res.status(statusCode).json({ error: errorMessage });
};

export const createSwapRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requester, requesterSchedule, recipient, recipientSchedule, message } = req.body;

    const newSwapRequest = new SwapRequest({
      requester,
      requesterSchedule,
      recipient,
      recipientSchedule,
      message,
    });

    await newSwapRequest.save({ session });
    await session.commitTransaction();
    io.emit('notification', { message: 'New swap request created!' }); // Emit notification
    res.status(201).json(newSwapRequest);
  } catch (err) {
    await session.abortTransaction();
    handleErrorResponse(res, err, err.code === 11000 ? 400 : 500);
  } finally {
    session.endSession();
  }
};

export const updateSwapStatus = async (req, res) => {
  const { swapId } = req.params;
  const { status, message, role, adminStatus } = req.body;

  const validationError = validateSwapRequest(swapId, status, role, adminStatus);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const swapRequest = await SwapRequest.findById(swapId).populate("requester").populate("recipient");
    if (!swapRequest) {
      return res.status(404).json({ error: "Swap request not found" });
    }

    // Update the status and adminApproval fields
    if (adminStatus) {
      swapRequest.adminApproval = adminStatus;
    }
    swapRequest.status = status;
    swapRequest.message = message;
    swapRequest.updatedAt = new Date();

    const updatedSwapRequest = await swapRequest.save();
    io.emit('notification', { message: 'Swap request updated!' }); // Emit notification
    res.status(200).json({ updatedSwapRequest });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const getSwapRequests = async (req, res) => {
  try {
    const swapRequests = await SwapRequest.find()
      .populate("requester", "username")
      .populate("recipient", "username")
      .populate("status")
      .populate("requesterSchedule")
      .populate("recipientSchedule");

    res.status(200).json(swapRequests);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const getSentSwapRequestsByThisUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const swapRequests = await SwapRequest.find({ requester: userId })
      .populate("recipient", "username")
      .populate("status")
      .populate("recipientSchedule");

    res.status(200).json(swapRequests);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const cancelSwapRequest = async (req, res) => {
  const { swapId } = req.params;

  try {
    const swapRequest = await SwapRequest.findById(swapId).populate("requester").populate("recipient");
    if (!swapRequest) {
      return res.status(404).json({ error: "Swap request not found" });
    }
    swapRequest.status = "cancelled";
    await swapRequest.save();
    io.emit('notification', { message: 'Swap request cancelled!' }); // Emit notification
    res.status(200).json(swapRequest);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const getReceivedSwapRequestsToThisUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const swapRequests = await SwapRequest.find({ recipient: userId })
      .populate("requester", "username")
      .populate("status")
      .populate("requesterSchedule");

    res.status(200).json(swapRequests);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const getSwapRequestById = async (req, res) => {
  const { swapId } = req.params;

  try {
    const swapRequest = await SwapRequest.findById(swapId)
      .populate("requester", "username")
      .populate("recipient", "username")
      .populate("status")
      .populate("requesterSchedule")
      .populate("recipientSchedule");

    if (!swapRequest) {
      return res.status(404).json({ error: "Swap request not found" });
    }

    res.status(200).json(swapRequest);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const getSwapRequestByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const swapRequests = await SwapRequest.find({ requester: userId })
      .populate("recipient", "username")
      .populate("status")
      .populate("requesterSchedule");

    res.status(200).json(swapRequests);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const getSwapRequestByRequesterId = async (req, res) => {
  const { requesterId } = req.params;

  try {
    const swapRequests = await SwapRequest.find({ requester: requesterId })
      .populate("recipient", "username")
      .populate("status")
      .populate("requesterSchedule");

    res.status(200).json(swapRequests);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const getApprovedSwapRequests = async (req, res) => {
  try {
    const approvedSwapRequests = await SwapRequest.find({ status: "approved" })
      .populate("requester", "username")
      .populate("recipient", "username")
      .populate("requesterSchedule")
      .populate("recipientSchedule");

    res.status(200).json(approvedSwapRequests);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};