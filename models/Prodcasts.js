import mongoose from "mongoose";

const prodcastSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
 
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    });

export default mongoose.model("prodcast", prodcastSchema);