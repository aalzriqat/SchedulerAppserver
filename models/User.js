import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["employee", "admin","validator"], default: "employee" },
  password: { type: String, required: true },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  swapRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "SwapRequest" }],
  isOpenForSwap: { type: Boolean, default: false },
});

// Middleware to update related documents
userSchema.post('save', async function(doc) {
  if (doc.schedule) {
    await mongoose.model('Schedule').updateOne(
      { _id: doc.schedule },
      { user: doc._id }
    );
  }
});

export default mongoose.model("User", userSchema);
