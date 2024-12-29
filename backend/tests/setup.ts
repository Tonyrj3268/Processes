// tests/setup.ts
import mongoose from "mongoose";
import redisClient from "@src/config/redis";

beforeAll(async () => {
  try {
    // 連接測試用 MongoDB
    await mongoose.connect("mongodb://localhost:27017/test-db");
    console.log("測試數據庫已連接");
  } catch (error) {
    console.error("測試數據庫連接失敗", error);
    throw error;
  }
});

beforeEach(async () => {
  try {
    // 清空所有集合
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      await Promise.all(
        Object.values(collections).map(collection => collection.deleteMany({}))
      );
    }
    // 清空 Redis
    await redisClient.flushall();
  } catch (error) {
    console.error("清理數據庫失敗", error);
  }
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
    await redisClient.quit();
    console.log("測試環境清理完成");
  } catch (error) {
    console.error("測試環境清理失敗", error);
  }
});