import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// connect MongoDB
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI environment variable is required");
}
const mongoURI: string = process.env.MONGO_URI;
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB 已連接"))
  .catch((err) => console.log(err));

// route
app.use("/", (req, res) => {
  res.send("Hello World");
});
// app.use("/api/auth", authRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/follow", followRoutes);
// app.use("/api/feed", feedRoutes);

export default app;
