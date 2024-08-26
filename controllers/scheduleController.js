import multer from "multer";
import nodemailer from "nodemailer";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
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

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

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

    console.log("File MIME type:", file.mimetype);
    console.log("File extension:", path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only Excel files are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helper function for error response
const handleErrorResponse = (res, error, statusCode = 500) => {
  console.error(error);
  res.status(statusCode).json({ error: error.message || error });
};

// Helper function to send email
const sendEmail = async (username, workingHours, offDays, week) => {
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

- **Working Hours:** ${workingHours || "Not Available"}
- **Off Days:** ${offDays || "Not Available"}
- **Week:** ${week ? `Week ${week}` : "Not Available"}

You will be able to view your schedule and manage swap requests in your dashboard.
Dashboard: http://localhost:3000/requester

If you have any questions or need further assistance, please feel free to reach out.

Best regards,
The Workflow Team
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().populate("user").lean();

    if (!schedules.length) {
      return res.status(404).json({ message: "No schedules found" });
    }
    res.status(200).json(schedules);
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

      const filePath = path.join(__dirname, "../uploads", req.file.filename);
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const schedulesData = xlsx.utils.sheet_to_json(sheet);

      const schedulesToSave = [];
      const emailPromises = [];
      const errors = [];

      for (const row of schedulesData) {
        const { username, offDays, workingHours, week } = row;

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
        });

        schedulesToSave.push(schedule);
        emailPromises.push(sendEmail(username, workingHours, offDays, week));
      }

      if (schedulesToSave.length > 0) {
        await Schedule.insertMany(schedulesToSave);
        await Promise.all(emailPromises);
      }

      fs.unlinkSync(filePath);

      if (errors.length > 0) {
        res.status(409).json({ message: errors });
      } else {
        res.status(201).json({
          message: "Schedules uploaded and emails sent successfully!",
        });
      }
    } catch (error) {
      handleErrorResponse(res, error);
    }
  },
];