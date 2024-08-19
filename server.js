import express from "express";
import connectDB from "./config/db.js";
import usersRouter from "./routes/users.js";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(cors());
app.use("/users", usersRouter);

connectDB();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
