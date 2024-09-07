import express from "express";
import connectDB from "./config/db.js";
import usersRouter from "./routes/usersRoutes.js";
import cors from "cors";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import swapRoutes from "./routes/swapRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import leavePlannerRoutes from "./routes/leavePlannerRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import { reportIssues } from "./controllers/reportIssuesController.js";
import path from "path";
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

dotenv.config();

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const userSocketMap = new Map();

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Define routes
app.use("/users", usersRouter);
app.use("/schedules", scheduleRoutes);
app.use("/swap", swapRoutes);
app.use("/preferences", preferenceRoutes);
app.use("/leaves", leavePlannerRoutes);
app.use("/news", newsRoutes);
app.post("/report-issues", reportIssues);

connectDB();
app.use(express.static(path.join(__dirname, "./upload")));
app.use(express.static(path.join(__dirname, "../client/build")));

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("server is ready");
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('register', (userId) => {
    userSocketMap.set(userId, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    userSocketMap.forEach((value, key) => {
      if (value === socket.id) {
        userSocketMap.delete(key);
      }
    });
  });
});

// Example endpoint to trigger notifications
app.post('/notify', (req, res) => {
  const { userId, notification } = req.body;
  const recipientSocketId = userSocketMap.get(userId);

  if (recipientSocketId) {
    io.to(recipientSocketId).emit('notification', notification);
  }

  res.status(200).send('Notification sent');
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});