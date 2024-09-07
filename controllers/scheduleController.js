import { BlobServiceClient } from "@azure/storage-blob";
import multer from "multer";
import nodemailer from "nodemailer";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import User from "../models/User.js";
import Schedule from "../models/Schedule.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Azure Blob Storage
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("Azure Storage connection string is not defined.");
}
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Define storage configuration for multer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const allowedExtensions = ['.xlsx', '.xls'];

    const mimetype = allowedMimeTypes.includes(file.mimetype);
    const extname = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only Excel files are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const getAvailableSchedules = (req, res) => {
  const { schedules, users, user } = req.body;

  const requesterSchedule = schedules.find(
    (schedule) => schedule.user && schedule.user._id === user._id
  );

  const availableSchedules = schedules
    .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
    .filter((schedule, index, self) => {
      const scheduleUser = users.find((u) => u._id === schedule.user._id);
      const latestSchedule = self.find((s) => s.user._id === schedule.user._id);

      const scheduleWorkingHours = schedule.workingHours;
      const requesterScheduleWorkingHours = requesterSchedule?.workingHours;

      if (!scheduleWorkingHours || !requesterScheduleWorkingHours) {
        console.error("Working hours are undefined for schedule or requester:", scheduleWorkingHours, requesterScheduleWorkingHours);
        return false;
      }

      const normalizedScheduleWorkingHours = normalizeTimeRange(scheduleWorkingHours);
      const normalizedRequesterScheduleWorkingHours = normalizeTimeRange(requesterScheduleWorkingHours);

      const result = isStartTimeGreaterOrEqual(normalizedScheduleWorkingHours, normalizedRequesterScheduleWorkingHours);
      return (
        scheduleUser &&
        scheduleUser._id !== user._id &&
        scheduleUser.isOpenForSwap === true &&
        scheduleUser.role === "employee" &&
        schedule?.skill === requesterSchedule?.skill &&
        schedule?.marketPlace === requesterSchedule?.marketPlace &&
        schedule._id === latestSchedule._id &&
        result === true
      );
    });

  res.json(availableSchedules);
};

// Helper function for error response
const handleErrorResponse = (res, error, statusCode = 500) => {
  console.error(error);
  res.status(statusCode).json({ error: error.message || error });
};

// Helper function to send email
const sendEmail = async (username, workingHours, offDays, week, skill, marketPlace) => {
  const transporter = nodemailer.createTransport({
 service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: `${username}@amazon.com`,
    subject: "Next Week(s) Schedule",
    text: `
Hello ${username},

Your schedule for next week(s) has been uploaded successfully.

Here are the details of your new schedule:

- Working Hours: ${workingHours || "Not Available"}
- Off Days: ${offDays || "Not Available"}
- Week: ${week ? `Week ${week}` : "Not Available"}
- Skill: ${skill || "Not Available"}
- Market Place: ${marketPlace || "Not Available"}

You will be able to view your schedule and manage swap requests in your dashboard.
Dashboard: https://criftyoo.github.io/Scheduler-Client/

If you have any questions or need further assistance, please feel free to reach out.

Best regards,
Workflow Team
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const getAllSchedules = async (_, res) => {
  try {
    const schedules = await Schedule.find()
      .populate({
        path: 'user',
        select: 'id isOpenForSwap role swapRequests skill marketplace'
      })
      .lean();

    if (!schedules.length) {
      return res.status(404).json({ message: "No schedules found" });
    }

    const filteredSchedules = schedules.map(schedule => ({
      ...schedule,
      user: {
        _id: schedule.user._id,
        isOpenForSwap: schedule.user.isOpenForSwap,
        role: schedule.user.role,
        swapRequests: schedule.user.swapRequests,
        skill: schedule.user.skill,
        marketplace: schedule.user.marketplace
      }
    }));

    res.json(filteredSchedules);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

export const uploadSchedule = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const blobName = `${Date.now()}-${req.file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype },
      });

      const downloadUrl = blockBlobClient.url;

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const schedulesData = xlsx.utils.sheet_to_json(sheet);

      const schedulesToSave = [];
      const emailPromises = [];
      const errors = [];

      for (const row of schedulesData) {
        const { username, offDays, workingHours, week, skill, marketPlace } = row;

        const user = await User.findOne({ username });

        if (!user) {
          errors.push(`User with username ${username} not found`);
          continue;
        }

        const existingSchedule = await Schedule.findOne({
          user: user._id,
          week,
        });
        if (existingSchedule) {
          errors.push(`${username}, Week ${week} schedule already exists`);
          continue;
        }

        const schedule = new Schedule({
          user: user._id,
          workingHours,
          offDays: offDays.split(","),
          week,
          skill,
          marketPlace
        });

        schedulesToSave.push(schedule);
        emailPromises.push(sendEmail(username, workingHours, offDays, week, skill, marketPlace));
      }

      if (schedulesToSave.length > 0) {
        await Schedule.insertMany(schedulesToSave);
        await Promise.all(emailPromises);
      }

      if (errors.length > 0) {
        res.status(409).json({ message: errors });
      } else {
        res.status(201).json({
          message: "Schedules uploaded and emails sent successfully!",
          downloadUrl,
        });
      }
    } catch (error) {
      handleErrorResponse(res, error);
    }
  },
];