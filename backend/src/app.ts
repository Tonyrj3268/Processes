import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// middleware
// app.use(bodyParser.json());
// app.use(cors());

// connect MongoDB
// mongoose
//   .connect("mongodb://localhost/processes", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("MongoDB 已连接"))
//   .catch((err) => console.log(err));

// route
app.use("/", (req, res) => {
  res.send("Hello World");
});
// app.use("/api/auth", authRoutes);
// app.use("/api/posts", postRoutes);
// app.use("/api/follow", followRoutes);
// app.use("/api/feed", feedRoutes);

export default app;
