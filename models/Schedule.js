import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Made user required
  workingHours: { type: String, required: true },
  offDays: { type: [String], required: true },
  week: { type: Number, required: true }, // Changed to Number
  isOpenForSwap: { type: Boolean, default: false },
  // createdAt and updatedAt will be handled by timestamps: true
  skill: {
    type: String,
    enum: [
      "phoneOnly",
      "Email",
      "PhoneMU",
      "MuOnly",
      "Specialty",
      "General",
      "Other",
    ],
  },
  marketPlace: { type: String, enum: ["AE", "SA", "EG", "UK", "Specialty"] },
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "rejected",
      "cancelled",
      "approved",
      "declined",
    ],
    default: "pending",
  },
  swapRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "SwapRequest" }],
}, { timestamps: true }); // Added timestamps

scheduleSchema.index({ user: 1, week: 1 }, { unique: true });

// Removed post-save hook that updated User.schedule with the latest schedule ID.
// This logic is potentially problematic for users with multiple schedules.
// If a link from User to current/primary schedule is needed, it should be managed differently.

export default mongoose.model("Schedule", scheduleSchema);
