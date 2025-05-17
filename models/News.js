import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: { // Optional image URL
    type: String,
  },
  // 'date' field removed, will rely on 'createdAt' from timestamps.
  // If a separate "publish_date" distinct from creation is ever needed, it can be added.
}, { timestamps: true }); // Adds createdAt and updatedAt

export default mongoose.model("News", NewsSchema);