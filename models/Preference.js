import mongoose from "mongoose";

const preferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  preferredShifts: [{ type: String }],
  preferredOffDays: [{ type: String }],
  week: { type: Date }
});

export default mongoose.model("Preference", preferenceSchema);
