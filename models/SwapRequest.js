import mongoose from "mongoose";

const swapRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requesterSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipientSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled",'approved','declined'],
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
}, {
  indexes: [
    {
      fields: {
        requester: 1,
        requesterSchedule: 1,
        recipient: 1,
        recipientSchedule: 1,
      },
      options: { unique: true },
    },
  ],
});

// Middleware to update related documents
swapRequestSchema.post('save', async function(doc) {
  await mongoose.model('User').updateMany(
    { _id: { $in: [doc.requester, doc.recipient] } },
    { $addToSet: { swapRequests: doc._id } }
  );
  await mongoose.model('Schedule').updateMany(
    { _id: { $in: [doc.requesterSchedule, doc.recipientSchedule] } },
    { $addToSet: { swapRequests: doc._id } }
  );
});

swapRequestSchema.post('remove', async function(doc) {
  await mongoose.model('User').updateMany(
    { _id: { $in: [doc.requester, doc.recipient] } },
    { $pull: { swapRequests: doc._id } }
  );
  await mongoose.model('Schedule').updateMany(
    { _id: { $in: [doc.requesterSchedule, doc.recipientSchedule] } },
    { $pull: { swapRequests: doc._id } }
  );
});

export default mongoose.model("SwapRequest", swapRequestSchema);