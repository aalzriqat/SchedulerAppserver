import ReportIssues from "../models/ReportIssues.js";

export const reportIssues = async (req, res) => {
  const { user, issue } = req.body;

  try {
    const reportIssues = await ReportIssues.create({ user, issue });

    res.status(201).json({ reportIssues });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getReportIssues = async (req, res) => {
  try {
    const reportIssues = await ReportIssues.find();

    res.status(200).json(reportIssues);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteReportIssues = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No reportIssues with id: ${id}`);

  await ReportIssues.findByIdAndRemove(id);

  res.json({ message: "ReportIssues deleted successfully." });
};

export const updateReportIssues = async (req, res) => {
  const { id } = req.params;
  const { user, issue } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`No reportIssues with id: ${id}`);

  const updatedReportIssues = { user, issue, _id: id };

  await ReportIssues.findByIdAndUpdate(id, updatedReportIssues, { new: true });

  res.json(updatedReportIssues);
};