import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'error', 'success', 'swap_request', 'leave_update', 'schedule_update'],
    default: 'info',
  },
  isRead: { type: Boolean, default: false, index: true },
  relatedEntity: {
    entityType: { 
        type: String, 
        enum: ['SwapRequest', 'LeaveRequest', 'NewsItem', 'Schedule', 'General'] 
    },
    entityId: { type: mongoose.Schema.Types.ObjectId } 
    // Note: ref can't be dynamic here easily without plugins or more complex setup.
    // Storing entityType and entityId is a common approach.
  },
  // createdAt and updatedAt will be handled by timestamps
}, { timestamps: true });

// Optional: TTL index to automatically delete old notifications after some time
// notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // e.g., 30 days

export default mongoose.model("Notification", notificationSchema);