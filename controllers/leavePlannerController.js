import leavePlanner from "../models/leaveplanner.js";

// Create a leave request
export const createLeaveRequest = async (req, res) => {
  try {
    const { user, fromDate, toDate, reason, OU } = req.body;
    const leaveRequest = new leavePlanner({
      user,
      fromDate,
      toDate,
      reason,
      OU,
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
    const leaveRequests = await leavePlanner.find().populate("user", "username email");
    res.json(leaveRequests);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get leave requests of a user
export const getUserLeaveRequestsById = async (req, res) => {
  try {
    const leaveRequests = await leavePlanner.find({ user: req.params.id });
    res.json(leaveRequests);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Update a leave request
export const updateLeaveRequest = async (req, res) => {
  try {
    const { id, fromDate, toDate, reason, status, OU, adminApproval, message } = req.body;

    // Find the existing leave request
    const existingLeaveRequest = await leavePlanner.findById(id);
    if (!existingLeaveRequest) {
      return res.status(404).json({ msg: "Leave request not found" });
    }

    // Check if the status is not pending
    if (existingLeaveRequest.status !== 'pending') {
      return res.status(400).json({ msg: "Cannot update leave request that is not pending" });
    }

    // Perform the update
    const leaveRequest = await leavePlanner.findByIdAndUpdate(
      id,
      { fromDate, toDate, reason, status, OU, adminApproval, message, updatedAt: Date.now() },
      { new: true }
    );

    res.json(leaveRequest);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Delete a leave request
export const deleteLeaveRequest = async (req, res) => {
  try {
    await leavePlanner.findByIdAndDelete(req.body.id);
    res.json({ msg: "Leave request deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};