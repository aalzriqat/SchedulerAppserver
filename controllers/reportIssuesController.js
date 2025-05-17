import mongoose from 'mongoose'; // Added mongoose import
import ReportIssues from "../models/ReportIssues.js";

// Create a new issue
export const reportIssues = async (req, res) => {
  const { title, description, category } = req.body;
  const reportedBy = req.user?.id;

  if (!reportedBy) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  if (!title || !description || !category) {
    return res.status(400).json({ message: "Missing required fields: title, description, category." });
  }

  try {
    const newIssue = await ReportIssues.create({
      title,
      description,
      category,
      reportedBy
      // status will default to 'open' as per model
    });
    // Populate reportedBy before sending response
    const populatedIssue = await ReportIssues.findById(newIssue._id).populate('reportedBy', 'username email');
    res.status(201).json(populatedIssue);
  } catch (error) {
    console.error("Error creating issue:", error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error while reporting issue." });
  }
};

// Get all issues (Admin)
export const getReportIssues = async (req, res) => {
  try {
    const issues = await ReportIssues.find().populate('reportedBy', 'username email').sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error fetching all issues:", error);
    res.status(404).json({ message: error.message });
  }
};

export const deleteReportIssues = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No issue found with id: ${id}`);

  try {
    const issue = await ReportIssues.findByIdAndDelete(id);
    if (!issue) return res.status(404).send(`No issue found with id: ${id}`);
    res.json({ message: "Issue deleted successfully." });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ message: "Server error while deleting issue." });
  }
};

// General update for an issue by Admin (e.g., title, description, category, adminNotes, status)
export const updateReportIssues = async (req, res) => {
  const { id } = req.params;
  // Do not allow 'reportedBy' to be changed.
  const { title, description, category, adminNotes, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No issue found with id: ${id}`);

  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (category) updateData.category = category;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes; // Allow clearing notes
  if (status) {
    const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status value. Must be one of: ${allowedStatuses.join(', ')}` });
    }
    updateData.status = status;
  }


  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "No update data provided." });
  }
  // Model uses {timestamps: true}, so updatedAt will be handled automatically.

  try {
    const updatedIssue = await ReportIssues.findByIdAndUpdate(id, { $set: updateData }, { new: true })
                                           .populate('reportedBy', 'username email');
    if (!updatedIssue) return res.status(404).send(`No issue found with id: ${id}`);
    res.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error while updating issue." });
  }
};

// Update only the status and adminNotes of an issue (Admin)
// This aligns with client's updateIssueStatusAdminApi
export const updateIssueStatus = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No issue found with id: ${id}`);

  if (!status) {
    return res.status(400).json({ message: "Status is required." });
  }
  const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status value. Must be one of: ${allowedStatuses.join(', ')}` });
  }

  const updateData = { status };
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  // Model uses {timestamps: true}, so updatedAt will be handled automatically.

  try {
    const updatedIssue = await ReportIssues.findByIdAndUpdate(id, { $set: updateData }, { new: true })
                                           .populate('reportedBy', 'username email');
    if (!updatedIssue) return res.status(404).send(`No issue found with id: ${id}`);
    res.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue status:", error);
     if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error while updating issue status." });
  }
};

// Get issues reported by the authenticated user
export const getMyReportedIssues = async (req, res) => {
  const reportedById = req.user?.id;
  if (!reportedById) {
    return res.status(401).json({ message: "User not authenticated." });
  }
  try {
    const issues = await ReportIssues.find({ reportedBy: reportedById })
                                     .populate('reportedBy', 'username email')
                                     .sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error fetching user's issues:", error);
    res.status(500).json({ message: "Server error while fetching your reported issues." });
  }
};