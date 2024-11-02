import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import initializePassport from "@src/config/passport";
import { MONGO_URI } from "@src/config/config";
import authRoutes from "@src/routes/authRoutes";
import userRoutes from "@src/routes/userRoutes";
import postRoutes from "@src/routes/postRoutes";
import commentRoutes from "@src/routes/commentRoutes";
import feedRoutes from "@src/routes/feedRoutes";
import eventRoutes from "@src/routes/eventRoutes";

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerOptions from "@src/swaggerOptions";

const app = express();

// middleware
app.use(express.json());
initializePassport(passport); // 初始化 Passport
app.use(passport.initialize());

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB 已連接"))
  .catch((err) => console.log(err));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/events", eventRoutes);

export default app;
