import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import initializePassport from "@src/config/passport";
import { MONGO_URI } from "@src/config/config";
import authRoutes from "@src/routes/authRoutes";
import userRoutes from "@src/routes/userRoutes";

const app = express();

// middleware
app.use(express.json());
initializePassport(passport); // 初始化 Passport
app.use(passport.initialize());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB 已連接"))
  .catch((err) => console.log(err));

// route
// app.use("/", (req, res) => {
//   res.send("Hello World");
// });
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/follow", followRoutes);
// app.use("/api/feed", feedRoutes);

export default app;
