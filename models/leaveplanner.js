import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";

const leavePlannerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: [String], required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  OU: {
    type: String,
    enum: ["AE", "SA", "EG", "specialty"],
    default: "pending",
  },
  adminApproval: {
    type: String,
    enum: ["pending", "approved", "declined", "cancelled"],
    default: "pending",
  },
  message: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to update related documents
leavePlannerSchema.post("save", async function (doc) {
  await Schedule.updateOne(
    { user: doc.user },
    { $addToSet: { preferences: doc._id } }
  );
});

export default mongoose.model("leavePlanner", leavePlannerSchema);
