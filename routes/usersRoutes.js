import { Router } from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getIsOpenForSwap,
  updateIsOpenForSwap,
  closeAllUsersForSwap,
  fetchAllUsers,
  // auth, // Will use common authMiddleware
  isAdmin,
  deleteAllSwaps,
  deleteAllSchedules,
  allowAllUsersForSwap
} from "../controllers/usersController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Import common auth middleware

const usersRouter = Router();

// Register User
// Rate limiting is handled within the registerUser controller function
usersRouter.post("/register", registerUser);

// Login User
// Rate limiting is handled within the loginUser controller function
usersRouter.post("/login", loginUser);

// Get current user
usersRouter.get("/me", authMiddleware, getCurrentUser);

// Get isOpenForSwap status
usersRouter.get('/isOpenForSwap', authMiddleware, getIsOpenForSwap);

// Update isOpenForSwap status
usersRouter.post('/updateOpenForSwap', authMiddleware, updateIsOpenForSwap);

// Set all users isOpenForSwap to false
usersRouter.post('/closeAll', authMiddleware, isAdmin, closeAllUsersForSwap);

// Fetch all users
usersRouter.get('/all', authMiddleware, isAdmin, fetchAllUsers);

// Delete all swap requests
usersRouter.delete('/deleteAllSwaps', authMiddleware, isAdmin, deleteAllSwaps);

// Delete all schedules
usersRouter.delete('/deleteAllSchedules', authMiddleware, isAdmin, deleteAllSchedules);

// Allow all users for swap
usersRouter.post('/allowAll', authMiddleware, isAdmin, allowAllUsersForSwap);

export default usersRouter;