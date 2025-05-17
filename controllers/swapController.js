import mongoose from "mongoose";
// import { isValidObjectId } from "mongoose"; // Redundant, mongoose.isValidObjectId can be used
import SwapRequest from "../models/SwapRequest.js";
import { io } from '../server.js'; // Import the io instance

// Removed unused validateSwapRequest helper function

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
    // Requester is now the authenticated user
    const { requesterSchedule, recipient, recipientSchedule, message } = req.body;
    const requesterId = req.user.id; // Get requester ID from authenticated user

    if (!requesterId || !recipient || !requesterSchedule || !recipientSchedule) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Missing required fields: requesterId, recipient, requesterSchedule, recipientSchedule." });
    }

    const newSwapRequest = new SwapRequest({
      requester: requesterId,
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
  const { status, message, adminStatus } = req.body; // 'role' from body is removed
  const authenticatedUser = req.user; // Populated by authMiddleware

  // Simplified validation, more specific checks will be done based on role
  if (!mongoose.isValidObjectId(swapId)) { // Changed to mongoose.isValidObjectId
    return res.status(400).json({ error: 'Invalid swap request ID' });
  }
  if (!status && !adminStatus) {
    return res.status(400).json({ error: 'Either status or adminStatus must be provided.' });
  }
  if (status && !['accepted', 'rejected', 'pending', 'approved', 'declined', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value for user update.' });
  }
   if (adminStatus && !['approved', 'declined', 'pending'].includes(adminStatus)) {
    return res.status(400).json({ error: 'Invalid adminStatus value for admin update.' });
  }

  try {
    const swapRequest = await SwapRequest.findById(swapId).populate("requester").populate("recipient");
    if (!swapRequest) {
      return res.status(404).json({ error: "Swap request not found" });
    }

    // Authorization and Logic
    if (authenticatedUser.role === 'admin') {
      if (adminStatus) {
        swapRequest.adminApproval = adminStatus;
        // Admins can also directly set the overall status if needed, e.g., to 'approved' or 'declined'
        if (adminStatus === 'approved' && status !== 'approved') swapRequest.status = 'approved';
        if (adminStatus === 'declined' && status !== 'declined') swapRequest.status = 'declined';
      }
      // If admin is also setting general status
      if (status) {
         swapRequest.status = status;
      }
    } else if (authenticatedUser.role === 'employee') {
      // Employee must be the recipient of the swap request
      if (swapRequest.recipient._id.toString() !== authenticatedUser.id) {
        return res.status(403).json({ error: "Forbidden: You are not the recipient of this swap request." });
      }
      // Employee can only accept or reject
      if (status === 'accepted' || status === 'rejected') {
        swapRequest.status = status;
      } else {
        return res.status(400).json({ error: "Invalid status update. Employees can only 'accept' or 'reject'." });
      }
      if (adminStatus) {
         return res.status(403).json({ error: "Forbidden: Employees cannot set admin approval status." });
      }
    } else {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions." });
    }

    if (message) swapRequest.message = message; // Optional message update
    // swapRequest.updatedAt = new Date(); // Removed, handled by timestamps: true

    const updatedSwapRequest = await swapRequest.save();

    // If a swap is approved, cancel other pending requests for these users
    if (updatedSwapRequest.status === 'approved' || updatedSwapRequest.adminApproval === 'approved') {
      try {
        await _internalCancelOtherRequests(updatedSwapRequest.requester._id.toString(), updatedSwapRequest.recipient._id.toString(), updatedSwapRequest._id.toString());
        console.log(`Internal cancellation of other requests triggered for requester ${updatedSwapRequest.requester._id} and recipient ${updatedSwapRequest.recipient._id} due to approval of ${updatedSwapRequest._id}`);
      } catch (cancelError) {
        console.error("Error during internal cancellation of other swap requests:", cancelError);
        // Decide if this error should affect the main response. For now, logging it.
      }
    }

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
  // userId from params is removed, using authenticated user's ID
  const requesterId = req.user.id;

  try {
    const swapRequests = await SwapRequest.find({ requester: requesterId })
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
  const authenticatedUser = req.user;

  try {
    const swapRequest = await SwapRequest.findById(swapId).populate("requester").populate("recipient");
    if (!swapRequest) {
      return res.status(404).json({ error: "Swap request not found" });
    }

    // Authorization: Requester or Admin can cancel
    const isRequester = swapRequest.requester._id.toString() === authenticatedUser.id;
    const isAdmin = authenticatedUser.role === 'admin';

    if (!isRequester && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to cancel this swap request." });
    }

    // Can only cancel if status is 'pending' (or other cancellable states as per business logic)
    if (swapRequest.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel request with status '${swapRequest.status}'. Only pending requests can be cancelled.` });
    }

    swapRequest.status = "cancelled";
    // swapRequest.updatedAt = new Date(); // Removed, handled by timestamps: true
    await swapRequest.save();
    io.emit('notification', { message: 'Swap request cancelled!' }); // Emit notification
    res.status(200).json(swapRequest);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const getReceivedSwapRequestsToThisUser = async (req, res) => {
  // userId from params is removed, using authenticated user's ID
  const recipientId = req.user.id;

  try {
    const swapRequests = await SwapRequest.find({ recipient: recipientId })
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
  const authenticatedUser = req.user; // Populated by authMiddleware

  if (!mongoose.isValidObjectId(swapId)) { // Changed to mongoose.isValidObjectId
    return res.status(400).json({ error: 'Invalid swap request ID' });
  }

  try {
    const swapRequest = await SwapRequest.findById(swapId)
      .populate("requester", "username email") // Added email for potential use
      .populate("recipient", "username email") // Added email for potential use
      .populate("status") // Assuming status is a direct field, not a ref
      .populate("requesterSchedule")
      .populate("recipientSchedule")
      .lean(); // Use lean for performance if not modifying

    if (!swapRequest) {
      return res.status(404).json({ error: "Swap request not found" });
    }

    // Authorization: Requester, Recipient, or Admin can view
    const isRequester = swapRequest.requester._id.toString() === authenticatedUser.id;
    const isRecipient = swapRequest.recipient._id.toString() === authenticatedUser.id;
    const isAdmin = authenticatedUser.role === 'admin';

    if (!isRequester && !isRecipient && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to view this swap request." });
    }

    res.status(200).json(swapRequest);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

// getSwapRequestByUserId removed as it's redundant with getSentSwapRequestsByThisUser and getReceivedSwapRequestsToThisUser

// getSwapRequestByRequesterId removed as it's redundant with getSentSwapRequestsByThisUser

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
          { requester: requesterId, status: 'pending' }, // Corrected field name
          { recipient: recipientId, status: 'pending' } // Corrected field name
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
// This function is now internal and not exported directly for API use.
const _internalCancelOtherRequests = async (requesterId, recipientId, approvedSwapId) => {
  if (!requesterId || !recipientId || !approvedSwapId) {
    console.error("_internalCancelOtherRequests: Missing IDs", {requesterId, recipientId, approvedSwapId});
    // Not throwing error here to prevent breaking the main flow if called without proper IDs,
    // but logging it. Depending on strictness, an error could be thrown.
    return;
  }
  try {
    // Cancel pending requests initiated by the requester, excluding the one just approved
    await SwapRequest.updateMany(
      { requester: requesterId, status: "pending", _id: { $ne: approvedSwapId } },
      { $set: { status: "cancelled", adminApproval: "declined", message: "Automatically cancelled due to another swap approval." } }
    );

    // Cancel pending requests where the requester is the recipient, excluding the one just approved
    await SwapRequest.updateMany(
      { recipient: requesterId, status: "pending", _id: { $ne: approvedSwapId } },
      { $set: { status: "cancelled", adminApproval: "declined", message: "Automatically cancelled due to another swap approval." } }
    );
    
    // Cancel pending requests initiated by the recipient, excluding the one just approved
    await SwapRequest.updateMany(
      { requester: recipientId, status: "pending", _id: { $ne: approvedSwapId } },
      { $set: { status: "cancelled", adminApproval: "declined", message: "Automatically cancelled due to another swap approval." } }
    );

    // Cancel pending requests where the recipient is also the recipient, excluding the one just approved
    // This covers cases where the recipient might have other incoming requests
     await SwapRequest.updateMany(
      { recipient: recipientId, status: "pending", _id: { $ne: approvedSwapId } },
      { $set: { status: "cancelled", adminApproval: "declined", message: "Automatically cancelled due to another swap approval." } }
    );

    console.log(`Successfully cancelled other pending requests for users ${requesterId} and ${recipientId}, excluding approved swap ${approvedSwapId}`);
  } catch (error) {
    console.error(`Error in _internalCancelOtherRequests for users ${requesterId}, ${recipientId} (approvedSwapId: ${approvedSwapId}):`, error);
    // Do not re-throw here to avoid breaking the main updateSwapStatus flow.
    // The error is logged for monitoring.
  }
};
