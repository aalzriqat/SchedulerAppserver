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
// const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
// if (!connectionString) {
//   throw new Error("Azure Storage connection string is not defined.");
// }
// const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
// const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Define storage configuration for multer
const storage = multer.memoryStorage();
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Folder where files will be uploaded
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
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
      console.log("Received upload request");

      if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("File uploaded:", req.file.originalname);

      const blobName = `${Date.now()}-${req.file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype },
      });

      console.log("File uploaded to Azure Blob Storage:", blobName);

      const downloadUrl = blockBlobClient.url;

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const schedulesData = xlsx.utils.sheet_to_json(sheet);

      console.log("Parsed Excel file:", schedulesData);

      const schedulesToSave = [];
      const emailPromises = [];
      const errors = [];

      for (const row of schedulesData) {
        const { username, offDays, workingHours, week, skill, marketPlace } = row;

        console.log("Processing row:", row);

        const user = await User.findOne({ username });

        if (!user) {
          console.log(`User with username ${username} not found`);
          errors.push(`User with username ${username} not found`);
          continue;
        }

        const existingSchedule = await Schedule.findOne({
          user: user._id,
          week,
        });
        if (existingSchedule) {
          console.log(`${username}, Week ${week} schedule already exists`);
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
        console.log("Schedules saved and emails sent");
      }

      if (errors.length > 0) {
        console.log("Errors encountered:", errors);
        res.status(409).json({ message: errors });
      } else {
        res.status(201).json({
          message: "Schedules uploaded and emails sent successfully!",
          downloadUrl,
        });
      }
    } catch (error) {
      console.error("Error uploading schedule:", error);
      handleErrorResponse(res, error);
    }
  },
];

// New controller function to get schedules by employee ID
export const getSchedulesByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }

    // Assuming your Schedule model has a 'user' field storing the ObjectId of the User
    // And your User model's _id is what's being passed as employeeId from the frontend
    const schedules = await Schedule.find({ user: employeeId })
      // .populate('user', 'name email username'); // Optionally populate user details if needed by frontend
      .lean(); // Use .lean() for faster queries if you don't need Mongoose documents

    // Unlike getAllSchedules, we might return an empty array if no schedules, not necessarily a 404
    // The frontend can then display "No schedules found"
    res.status(200).json(schedules);

  } catch (error) {
    console.error("Error fetching schedules for employee:", error);
    // Use the existing handleErrorResponse or a similar pattern
    handleErrorResponse(res, error, 500, "Server error fetching employee schedules.");
  }
};

// Controller to update shift swap availability
export const updateShiftAvailabilityController = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { isAvailableForSwap } = req.body;
    const userId = req.user.id; // Assuming auth middleware adds user to req

    if (typeof isAvailableForSwap !== 'boolean') {
      return res.status(400).json({ message: "isAvailableForSwap must be a boolean." });
    }

    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // Ensure the authenticated user owns this schedule or is an admin
    // For now, only allowing owner to change. Admin logic can be added.
    if (schedule.user.toString() !== userId) {
      return res.status(403).json({ message: "User not authorized to update this schedule." });
    }

    schedule.isOpenForSwap = isAvailableForSwap;
    await schedule.save();

    // Populate user details before sending back, similar to getSchedulesByEmployeeId if needed
    // For consistency with BackendShift interface, we can just send the updated schedule.
    // Or, if frontend expects populated user:
    // const populatedSchedule = await Schedule.findById(schedule._id).populate('user', 'name username email role').lean();
    // res.status(200).json(populatedSchedule);
    
    res.status(200).json(schedule);

  } catch (error) {
    console.error("Error updating shift swap availability:", error);
    handleErrorResponse(res, error, 500, "Server error updating shift swap availability.");
  }
};

export const getFilteredAvailableSchedules = async (req, res) => {
  try {
    const { week, excludeUserId } = req.query;

    if (!week || !excludeUserId) {
      return res.status(400).json({ message: "Week and excludeUserId are required query parameters." });
    }

    const weekNumber = parseInt(week, 10);
    if (isNaN(weekNumber)) {
      return res.status(400).json({ message: "Week must be a valid number." });
    }

    const query = {
      week: weekNumber,
      isOpenForSwap: true,
      user: { $ne: excludeUserId }
    };

    const schedules = await Schedule.find(query)
      .populate({
        path: 'user',
        select: '_id name username role isOpenForSwap'
      })
      .lean();

    res.status(200).json(schedules);

  } catch (error) {
    // Using the existing handleErrorResponse
    handleErrorResponse(res, error, 500);
  }
};


// Modify handleErrorResponse slightly if a default message is good
// const handleErrorResponse = (res, error, statusCode = 500, defaultMessage = "Server error") => {
//   console.error(error);
//   res.status(statusCode).json({ message: error.message || defaultMessage });
// };