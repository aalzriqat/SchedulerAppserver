import mongoose from "mongoose";

const reportIssuesSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issue: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});


reportIssuesSchema.post('save', async function (doc) {
    if (doc.user) {
        await mongoose.model('User').updateOne(
            { _id: doc.user },
            { reportIssues: doc._id }
        );
    }
}
);

export default mongoose.model("ReportIssues", reportIssuesSchema);
