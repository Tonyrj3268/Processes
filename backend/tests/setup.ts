// tests/setup.ts
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import redisClient from "@src/config/redis";

let mongoReplSet: MongoMemoryReplSet;
// 在所有測試之前，啟動 MongoMemoryServer 並建立 MongoDB 連接
beforeAll(async () => {
  try {
    mongoReplSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 }, // 單節點副本集
    });
    const uri = mongoReplSet.getUri();

    await mongoose.connect(uri);

    console.log("MongoMemoryServer 已啟動並連接");
  } catch (error) {
    console.error("MongoMemoryServer 啟動失敗", error);
    throw error; // 終止測試
  }
});

// 每個測試執行前清空資料庫與 Redis
beforeEach(async () => {
  // 清空 MongoDB
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  // 清空 Redis
  await redisClient.flushall();
});

// 在所有測試完成後斷開資料庫連接並停止 MongoMemoryServer
afterAll(async () => {
  try {
    await mongoose.disconnect();
    await mongoReplSet.stop();
    await redisClient.quit(); // 關閉 Redis 模擬客戶端
  } catch (error) {
    console.error("測試環境清理失敗", error);
  }
});
