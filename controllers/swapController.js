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
    errorMessage = "You have previously requested a swap with this user for the selected week.";
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
      .populate("requester", "username")
      .populate("recipient", "username")
      .populate("status")
      .populate("recipientSchedule")
      .populate("requesterSchedule")
      


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
// cancel all swap requests for requester and recipient if status changed to accepted 


export const cancelAllPendingSwapRequests = async (req, res) => {
  const { requesterId, recipientId } = req.params;

  if (!requesterId || !recipientId) {
    return res.status(400).json({ message: 'Requester ID and Recipient ID are required.' });
  }

  try {
    const result = await SwapRequest.updateMany(
      {
        $or: [
          { user: requesterId, status: 'pending' },
          { recipientId: recipientId, status: 'pending' }
        ]
      },
      { status: 'cancelled' }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'No pending swap requests found for the specified users.' });
    }

    res.status(200).json({ message: 'All pending swap requests cancelled.', result });
  } catch (error) {
    console.error('Error cancelling pending swap requests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

//cancel all swap requests for both requester and recipient once a swap status updates to approved

export const cancelAllSwapRequests = async (req, res) => {
  const { requesterId, recipientId } = req.body;

  try {
    await SwapRequest.updateMany(
      { requester: requesterId, status: { $ne: "approved" } },
      { status: "cancelled" }
    );

    await SwapRequest.updateMany(
      { recipient: recipientId, status: { $ne: "approved" } },
      { status: "cancelled" }
    );

    res.status(200).json({ message: "All swap requests cancelled" });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};
