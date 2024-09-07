import { Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getIsOpenForSwap,
  updateIsOpenForSwap,
  closeAllUsersForSwap,
  fetchAllUsers,
  auth,
  deleteAllSwaps,
  deleteAllSchedules,
  allowAllUsersForSwap
} from "../controllers/usersController.js";
import rateLimit from 'express-rate-limit';

const usersRouter = Router();

// // Rate limiting for sensitive routes
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 5 requests per windowMs
//   message: "Too many login attempts from this IP, please try again later."
// });

// Register User
usersRouter.post("/register", registerUser);

// Login User
usersRouter.post("/login", loginUser);

// Get current user
usersRouter.get("/me", auth, getCurrentUser);

// Get isOpenForSwap status
usersRouter.get('/isOpenForSwap', auth, getIsOpenForSwap);

// Update isOpenForSwap status
usersRouter.post('/updateOpenForSwap', auth, updateIsOpenForSwap);

// Set all users isOpenForSwap to false
usersRouter.post('/closeAll', closeAllUsersForSwap);

// Fetch all users
usersRouter.get('/all', auth, fetchAllUsers);

// Delete all swap requests
usersRouter.delete('/deleteAllSwaps',  deleteAllSwaps);

// Delete all schedules
usersRouter.delete('/deleteAllSchedules',  deleteAllSchedules);

// Allow all users for swap
usersRouter.post('/allowAll', allowAllUsersForSwap);

export default usersRouter;