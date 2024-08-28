import express from "express";
import connectDB from "./config/db.js";
import usersRouter from "./routes/users.js";
import cors from "cors";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import swapRoutes from "./routes/swapRoutes.js";
import preferenceRoutes from "./routes/preferenceRoutes.js";
import path from "path";
import { fileURLToPath } from 'url';

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/users", usersRouter);
app.use("/schedules", scheduleRoutes);
app.use("/swap", swapRoutes);
app.use("/preferences",preferenceRoutes);

connectDB();
app.use(express.static(path.join(__dirname, "./upload")));
app.use(express.static(path.join(__dirname, "../client/build")));
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("server is ready");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});