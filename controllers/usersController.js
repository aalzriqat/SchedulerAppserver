import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "config"; // Import config package
import asyncHandler from "express-async-handler";
import rateLimit from "express-rate-limit";
import sanitize from "mongo-sanitize";

// dotenv.config(); // Removed, as it's called in server.js or db.js

// The 'auth' middleware previously here has been removed.
// Please use the common authMiddleware from '../middleware/authMiddleware.js' in your routes.

// Middleware to check for admin role
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: "Access denied. Admin role required." });
  }
};
// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

// Register User
export const registerUser = [
  limiter,
  check("username", "Username is required").notEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Sanitize parts of the body, but use the raw password for hashing
    const sanitizedBody = sanitize(req.body);
    const rawEmail = sanitizedBody.email; // Get potentially unnormalized email
    const username = sanitizedBody.username;
    const rawPassword = req.body.password; // Use raw password from original body

    if (!rawEmail || !rawPassword || !username) { // Added username check
        return res.status(400).json({ errors: [{ msg: "Username, email and password are required." }] });
    }

    const email = rawEmail.toLowerCase().trim(); // Normalize email
    const password = rawPassword.trim(); // Trim password

    let user = await User.findOne({ email }); // Use normalized email for check
    if (user) {
      // FOR DEBUGGING/FIXING DATA: Allow re-registration by deleting existing user
      console.log(`[Register Attempt] User ${email} already exists. Deleting old record to allow re-registration for data correction.`);
      await User.deleteOne({ email });
      // return res.status(400).json({ errors: [{ msg: "User already exists" }] }); // Original behavior
    }

    user = new User({
      username, // username is from sanitizedBody
      email,    // Store normalized email
      password, // password (trimmed) will be hashed by Mongoose pre-save or explicitly here
    });

    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const jwtSecret = config.get('jwtSecret');
    if (!jwtSecret) throw new Error('jwtSecret not configured for signing');
    jwt.sign(payload, jwtSecret, { expiresIn: "5d" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  })
];

// Login User
export const loginUser = [
  limiter, // Added rate limiter
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
  asyncHandler(async (req, res) => {
    console.log('[Login Attempt] Raw req.body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[Login Attempt] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const sanitizedBody = sanitize(req.body);
    const rawEmail = sanitizedBody.email;
    const rawPassword = req.body.password;
    console.log('[Login Attempt] Raw credentials from body:', { rawEmail, rawPassword });


    if (!rawEmail || !rawPassword) {
        console.log('[Login Attempt] Email or password missing.');
        return res.status(400).json({ errors: [{ msg: "Email and password are required." }] });
    }
    
    const email = rawEmail.toLowerCase().trim();
    const password = rawPassword.trim();
    console.log('[Login Attempt] Processed credentials for lookup:', { email, password });

    let user = await User.findOne({ email });
    
    if (!user) {
      console.log(`[Login Attempt] User not found for email: ${email}`);
      return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
    }
    console.log(`[Login Attempt] User found for email: ${email}`, { userId: user._id, storedHash: user.password });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[Login Attempt] Password comparison result for user ${email}: ${isMatch}`);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
    }
    console.log(`[Login Attempt] Successful for user: ${email}`);

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const jwtSecret = config.get('jwtSecret');
    if (!jwtSecret) throw new Error('jwtSecret not configured for signing');
    jwt.sign(payload, jwtSecret, { expiresIn: "5d" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  })
];

// Get current user
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// Get isOpenForSwap status
export const getIsOpenForSwap = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('isOpenForSwap');
  res.json({ isOpenForSwap: user.isOpenForSwap });
});

// Update isOpenForSwap status
export const updateIsOpenForSwap = asyncHandler(async (req, res) => {
  const { isOpenForSwap } = sanitize(req.body);
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { isOpenForSwap },
    { new: true }
  );
  res.json({ isOpenForSwap: user.isOpenForSwap });
});

// Set all users isOpenForSwap to false
export const closeAllUsersForSwap = asyncHandler(async (req, res) => {
  await User.updateMany({}, { isOpenForSwap: false });
  res.json({ msg: 'All users are closed for swap' });
});

export const allowAllUsersForSwap = asyncHandler(async (req, res) => {
  await User.updateMany({}, { isOpenForSwap: true });
  res.json({ msg: 'All users are open for swap' });
});

// Fetch all users
export const fetchAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Delete all swap requests for all users

export const deleteAllSwaps = asyncHandler(async (req, res) => {
  await User.updateMany({}, { swapRequests: [] });
  res.json({ msg: 'All swap requests deleted' });
});

// Delete all schedules for all users

export const deleteAllSchedules = asyncHandler(async (req, res) => {
  await User.updateMany({}, { schedules: [] });
  res.json({ msg: 'All schedules deleted' });
});