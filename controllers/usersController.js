import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import asyncHandler from "express-async-handler";
import rateLimit from "express-rate-limit";
import sanitize from "mongo-sanitize";

dotenv.config();

// Middleware to authenticate token
export const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
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
    const { username, email, password } = sanitize(req.body);

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: "User already exists" }] });
    }

    user = new User({
      username,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5d" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  })
];

// Login User
export const loginUser = [
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = sanitize(req.body);

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5d" }, (err, token) => {
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