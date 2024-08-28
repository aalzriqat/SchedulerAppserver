import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";

const preferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User",required: true },
  preferredShift: { type: String, required: true },
  preferredOffDays: { type: [String], required: true },
  week: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

Schedule.schema.post("save", async function (doc) {
  if (doc.user) {
    await mongoose.model("Preference").updateOne(
      { user: doc.user },
    );
  }
});

export default mongoose.model("Preference", preferenceSchema);
