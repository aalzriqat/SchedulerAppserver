import { Router } from "express";
import {
  registerUser,
  loginUser,
  auth,
  getCurrentUser,
  getIsOpenForSwap,
  updateIsOpenForSwap,
  closeAllForSwap,
} from "../controllers/usersController.js";

const usersRouter = Router();

usersRouter.post("/register", registerUser);
usersRouter.post("/login", loginUser);
usersRouter.get("/me", auth, getCurrentUser);
usersRouter.get("/isOpenForSwap", auth, getIsOpenForSwap);
usersRouter.post("/updateOpenForSwap", auth, updateIsOpenForSwap);
usersRouter.post("/closeAll", auth, closeAllForSwap);

export default usersRouter;