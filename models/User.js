import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["employee", "admin","validator"], default: "employee" },
  password: { type: String, required: true },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" }, // Link to a primary/current schedule
  // createdAt and updatedAt will be handled by timestamps: true
  swapRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "SwapRequest" }],
  isOpenForSwap: { type: Boolean, default: false },
}, { timestamps: true }); // Added timestamps

// Removed post-save hook. The link from Schedule to User is primary.
// If User.schedule field is set, it's assumed to be managed at a higher level if needed.

export default mongoose.model("User", userSchema);
