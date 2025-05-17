import mongoose from "mongoose";

const reportIssuesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ['bug', 'feature_request', 'ui_ux', 'other']
    },
    status: {
        type: String,
        required: true,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminNotes: { type: String, default: '' },
}, { timestamps: true }); // Use timestamps for createdAt and updatedAt

// Removing the post save hook as its logic for updating User model is likely incorrect for this context.
// If User needs to store references to issues, it should be an array of issue IDs.

export default mongoose.model("ReportIssues", reportIssuesSchema);
