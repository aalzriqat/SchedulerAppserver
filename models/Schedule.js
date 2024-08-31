import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  workingHours: { type: String, required: true },
  offDays: { type: [String], required: true },
  week: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  skill: { type: [String], enum: ["phone", "mu", "email", "blinded"] },
  swapRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "SwapRequest" }],
});

scheduleSchema.index({ user: 1, week: 1 }, { unique: true });

// Middleware to update related documents
scheduleSchema.post('save', async function(doc) {
  if (doc.user) {
    await mongoose.model('User').updateOne(
      { _id: doc.user },
      { schedule: doc._id }
    );
  }
});

export default mongoose.model("Schedule", scheduleSchema);