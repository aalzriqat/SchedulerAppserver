import LeavePlanner from "../models/leaveplanner.js"; // Changed to PascalCase

// Create a leave request
export const createLeaveRequest = async (req, res) => {
  try {
    // User ID should be derived from authenticated user (e.g., req.user.id from auth middleware)
    // Ensure your auth middleware provides this.
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated or user ID missing." });
    }

    const { leaveType, fromDate, toDate, reason, OU } = req.body;

    // Basic validation for required fields from client payload
    if (!leaveType || !fromDate || !toDate || !reason || !OU) { // Added OU to validation
        return res.status(400).json({ msg: "Missing required fields: leaveType, fromDate, toDate, reason, OU." });
    }
    
    const leaveRequest = new LeavePlanner({ // Changed to PascalCase
      user: userId,
      leaveType,
      fromDate,
      toDate,
      reason,
      OU,           // OU is still taken from body as per original controller logic
    });
    await leaveRequest.save();
    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get all leave requests
export const getAllLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeavePlanner.find().populate("user", "username email"); // Changed to PascalCase
    res.json(leaveRequests);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get leave requests of the authenticated user
export const getUserLeaveRequestsById = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ msg: "User not authenticated or user ID missing." });
    }
    const leaveRequests = await LeavePlanner.find({ user: userId }).populate("user", "username email"); // Changed to PascalCase
    res.json(leaveRequests);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Update a leave request
export const updateLeaveRequest = async (req, res) => {
  try {
    const { _id, fromDate, toDate, reason, status, OU, adminApproval, message } = req.body;
    const authenticatedUser = req.user;

    if (!_id) {
      return res.status(400).json({ msg: "Leave request ID (_id) is required in the request body." });
    }

    // Find the existing leave request
    const existingLeaveRequest = await LeavePlanner.findById(_id); // Changed to PascalCase
    if (!existingLeaveRequest) {
      return res.status(404).json({ msg: "Leave request not found" });
    }

    // Authorization: User owns the request or is an admin
    const isOwner = existingLeaveRequest.user.toString() === authenticatedUser.id;
    const isAdmin = authenticatedUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "Not authorized to update this leave request." });
    }
    
    // Only owner can update if status is 'pending'. Admin can update regardless of status (e.g. to approve/reject)
    if (isOwner && existingLeaveRequest.status !== 'pending') {
      return res.status(400).json({ msg: "Cannot update leave request that is not pending." });
    }

    // Construct update object carefully based on role
    // updatedAt will be handled by timestamps: true in the model
    const updateData = {};
    if (fromDate) updateData.fromDate = fromDate;
    if (toDate) updateData.toDate = toDate;
    if (reason) updateData.reason = reason;
    if (OU) updateData.OU = OU; // Assuming OU can be updated by owner/admin
    if (message) updateData.message = message; // Assuming message can be updated by owner/admin

    if (isAdmin) {
      // Admin can update status and adminApproval
      if (status) updateData.status = status;
      if (adminApproval) updateData.adminApproval = adminApproval;
    } else if (isOwner) {
      // Owner can only update certain fields and cannot change status directly (status changes via adminApproval)
      // or if they are withdrawing a pending request (setting status to 'cancelled' for example)
      if (status && status === 'cancelled' && existingLeaveRequest.status === 'pending') {
         updateData.status = 'cancelled'; // Allow owner to cancel their pending request
      } else if (status && status !== existingLeaveRequest.status) {
        // Prevent owner from arbitrarily changing status unless cancelling
        return res.status(403).json({ msg: "Owners can only cancel pending requests or update details. Status changes are admin-driven." });
      }
      // Owner cannot set adminApproval
      if (adminApproval) {
        return res.status(403).json({ msg: "Owners cannot set admin approval status." });
      }
    }
    
    // Perform the update
    const leaveRequest = await LeavePlanner.findByIdAndUpdate( // Changed to PascalCase
      _id,
      { $set: updateData },
      { new: true }
    ).populate("user", "username email");

    res.json(leaveRequest);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Delete a leave request
export const deleteLeaveRequest = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const authenticatedUser = req.user;

    if (!leaveRequestId) { // Should be caught by route structure, but good practice
      return res.status(400).json({ msg: "Leave request ID is required in URL." });
    }

    const leaveRequestToDelete = await LeavePlanner.findById(leaveRequestId); // Changed to PascalCase

    if (!leaveRequestToDelete) {
      return res.status(404).json({ msg: "Leave request not found" });
    }

    // Authorization: User owns the request or is an admin
    const isOwner = leaveRequestToDelete.user.toString() === authenticatedUser.id;
    const isAdmin = authenticatedUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "Not authorized to delete this leave request." });
    }

    // Optional: Add condition, e.g., only allow deletion if status is 'pending'
    if (leaveRequestToDelete.status !== 'pending' && !isAdmin) { // Admin can delete regardless of status
      return res.status(400).json({ msg: `Cannot delete leave request with status '${leaveRequestToDelete.status}'. Only pending requests can be deleted by owner.` });
    }

    await LeavePlanner.findByIdAndDelete(leaveRequestId); // Changed to PascalCase
    res.json({ msg: "Leave request deleted successfully" });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') { // Handle invalid ObjectId format for leaveRequestId
        return res.status(400).json({ msg: 'Invalid Leave Request ID format.' });
    }
    res.status(500).send("Server error");
  }
};