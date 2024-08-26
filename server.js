import express from "express";
import connectDB from "./config/db.js";
import usersRouter from "./routes/users.js";
import cors from "cors";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import swapRoutes from "./routes/swapRoutes.js";
import path from "path";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/users", usersRouter);
app.use("/schedules", scheduleRoutes);
app.use("/swap", swapRoutes);

connectDB();
app.use(express.static(path.join(path.resolve(), "../client/build")));

app.use(express.static(path.join(path.resolve(), "./upload")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("server is ready");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
