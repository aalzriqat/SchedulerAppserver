import { Router } from "express";
import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import asyncHandler from "express-async-handler";
dotenv.config();

const usersRouter = Router();

// Middleware to authenticate token
const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.jwtSecret);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// Register User
usersRouter.post(
  "/register",
  [
    check("username", "Username is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: "User already exists" }] });
    }

    user = new User({
      username,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, process.env.jwtSecret, { expiresIn: "15m" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  })
);

// Login User
usersRouter.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

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

    jwt.sign(payload, process.env.jwtSecret, { expiresIn: "5d" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  })
);

// Get current user
usersRouter.get("/me", auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
}));

// Get isOpenForSwap status
usersRouter.get('/isOpenForSwap', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('isOpenForSwap');
  res.json({ isOpenForSwap: user.isOpenForSwap });
}));

// Update isOpenForSwap status
usersRouter.post('/updateOpenForSwap', auth, asyncHandler(async (req, res) => {
  const { isOpenForSwap } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { isOpenForSwap },
    { new: true }
  );
  res.json({ isOpenForSwap: user.isOpenForSwap });
}));

// Set all users isOpenForSwap to false
usersRouter.post('/closeAll', auth, asyncHandler(async (req, res) => {
  await User.updateMany({}, { isOpenForSwap: false });
  res.json({ msg: 'All users are closed for swap' });
}));

// Fetch all users
usersRouter.get('/all', auth, asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
}));

export default usersRouter;