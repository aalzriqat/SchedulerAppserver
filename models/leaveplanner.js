import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";

const leavePlannerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  leaveType: { type: String, required: true }, // Added leaveType
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true }, // Changed to Date
  reason: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  OU: { // Organizational Unit
    type: String,
    enum: ["AE", "SA", "EG", "specialty"],
    required: true // Made OU required, removed problematic default
  },
  adminApproval: { // This might be redundant if 'status' reflects final state
    type: String,
    enum: ["pending", "approved", "declined", "cancelled"], // 'cancelled' might not apply to adminApproval
    default: "pending",
  },
  message: { type: String }, // For admin notes or general communication
}, { timestamps: true }); // Replaced manual createdAt/updatedAt with timestamps option

// Middleware to update related documents
leavePlannerSchema.post("save", async function (doc) {
  await Schedule.updateOne(
    { user: doc.user },
    { $addToSet: { preferences: doc._id } }
  );
});

export default mongoose.model("leavePlanner", leavePlannerSchema);
