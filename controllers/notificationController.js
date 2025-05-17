import mongoose from 'mongoose'; // Added mongoose import
import Notification from '../models/Notification.js';
import User from '../models/User.js'; // For potential future use if needed

// Helper function to create a notification (can be called by other controllers)
export const createNotification = async (userId, message, type, relatedEntity = null) => {
  try {
    if (!userId || !message || !type) {
      console.error('Missing required fields for creating notification:', { userId, message, type });
      return null; // Or throw error
    }
    const notification = new Notification({
      user: userId,
      message,
      type,
      relatedEntity, // relatedEntity should be an object like { entityType: 'SwapRequest', entityId: 'someId' }
    });
    await notification.save();
    
    // Emit Socket.IO event to the specific user if they are connected
    // This requires access to 'io' and 'userSocketMap' from server.js
    // For simplicity in this controller, we'll skip direct emission here.
    // Socket emission should ideally be handled in a service layer or after this function returns.
    console.log(`Notification created for user ${userId}: ${message}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null; // Or throw error
  }
};

// Get notifications for the authenticated user
export const getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    // Fetch notifications, sort by most recent, limit results if needed
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50); // Example limit

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications for user:", error);
    res.status(500).json({ message: "Server error while fetching notifications." });
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    // notificationIds should be an array of notification _id strings from req.body
    const { notificationIds } = req.body; 

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ message: "Notification IDs are required as an array." });
    }

    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, user: userId, isRead: false }, // Ensure user owns them
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: `${result.modifiedCount} notifications marked as read.` });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Server error while marking notifications as read." });
  }
};

// (Optional) Delete a specific notification
export const deleteNotification = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated." });
    }
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID." });
    }

    try {
        const result = await Notification.deleteOne({ _id: notificationId, user: userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Notification not found or not owned by user." });
        }
        res.status(200).json({ message: "Notification deleted successfully." });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Server error while deleting notification." });
    }
};

// (Optional) Delete all notifications for a user
export const deleteAllNotificationsForUser = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "User not authenticated." });
    }
    try {
        await Notification.deleteMany({ user: userId });
        res.status(200).json({ message: "All notifications deleted for user." });
    } catch (error) {
        console.error("Error deleting all notifications for user:", error);
        res.status(500).json({ message: "Server error while deleting all notifications." });
    }
};