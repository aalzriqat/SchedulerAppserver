import mongoose from "mongoose";
// Schedule import removed as it's no longer used.

const preferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  preferredShift: { type: String, required: true },
  preferredOffDays: { type: String, required: true },
  week: { type: Number, required: true },
  notes: { type: String, default: '' },
  unavailability: { type: String, default: '' },
  // createdAt and updatedAt will be handled by timestamps: true
}, { timestamps: true });

// Add a unique index to ensure a user can only apply a preference once for the same week
preferenceSchema.index({ user: 1, week: 1 }, { unique: true });

// Removed problematic and incomplete Schedule.schema.post("save") hook.
// If Schedule updates need to affect Preferences, this logic should be elsewhere or re-evaluated.

export default mongoose.model("Preference", preferenceSchema);