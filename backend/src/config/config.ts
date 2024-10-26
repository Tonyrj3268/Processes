// src/config/config.ts
import dotenv from "dotenv";

dotenv.config(); // 加載 .env 文件中的環境變數

// 集中管理環境變數
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI environment variable is required");
}
export const MONGO_URI = process.env.MONGO_URI;
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in environment variables");
}
export const JWT_SECRET = process.env.JWT_SECRET;

// export const GOOGLE_CLIENT_ID =
//   process.env.GOOGLE_CLIENT_ID || "your_google_client_id";
// export const GOOGLE_CLIENT_SECRET =
//   process.env.GOOGLE_CLIENT_SECRET || "your_google_client_secret";
// export const DATABASE_URL = process.env.DATABASE_URL || "your_database_url";
