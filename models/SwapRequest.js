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
  skill: {type: String,
    enum: ["phoneOnly", "Email", "PhoneMU", "MuOnly", "Specialty", "General", "Other"],
    },
    marketPlace:{type: String,enum: ["AE", "SA","EG","UK","Specialty"]},
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled", "approved", "declined"],
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

// Pre-save hook to check for duplicates only on creation
swapRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingRequest = await mongoose.model('SwapRequest').findOne({
      requester: this.requester,
      requesterSchedule: this.requesterSchedule,
      recipient: this.recipient,
      recipientSchedule: this.recipientSchedule,
    });

    if (existingRequest) {
      const error = new Error('You have already requested a swap with this user.');
      error.name = 'DuplicateSwapRequestError';
      return next(error);
    }
  }
  next();
});

// Indexing
swapRequestSchema.index({ requester: 1, requesterSchedule: 1, recipient: 1, recipientSchedule: 1 }, { unique: true });

// Error handling for duplicate key errors
swapRequestSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('You have already requested a swap with this user.'));
  } else {
    next(error);
  }
});

export default mongoose.model("SwapRequest", swapRequestSchema);