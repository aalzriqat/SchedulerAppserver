import { Router } from "express";
import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "config";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const usersRouter = Router();

// Register User
usersRouter.post(
  "/register",
  [
    check("username", "Username is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Please enter a password with 6 or more characters").isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;
    try {
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
      jwt.sign(payload, process.env.jwtSecret, { expiresIn: "15 minutes" }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server error");
    }
  }
);

// Login User
usersRouter.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
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
      jwt.sign(payload, process.env.jwtSecret, { expiresIn: "5 days" }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server error");
    }
  }
);

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

// Get current user
usersRouter.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// Get isOpenForSwap status
usersRouter.get('/isOpenForSwap', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isOpenForSwap');
    res.json({ isOpenForSwap: user.isOpenForSwap });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update isOpenForSwap status
usersRouter.post('/updateOpenForSwap', auth, async (req, res) => {
  try {
    const { isOpenForSwap } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isOpenForSwap },
      { new: true }
    );
    res.json({ isOpenForSwap: user.isOpenForSwap });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Set all users isOpenForSwap to false
usersRouter.post('/closeAll', auth, async (req, res) => {
  try {
    await User.updateMany({}, { isOpenForSwap: false });
    res.json({ msg: 'All users are closed for swap' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Fetch all users
usersRouter.get('/all', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default usersRouter;