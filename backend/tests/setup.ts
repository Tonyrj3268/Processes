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

// // tests/setup.ts
// import { MongoMemoryReplSet } from "mongodb-memory-server";
// import mongoose from "mongoose";
// import redisClient from "@src/config/redis";

// let mongoReplSet: MongoMemoryReplSet;
// // 在所有測試之前，啟動 MongoMemoryServer 並建立 MongoDB 連接
// beforeAll(async () => {
//   try {
//     mongoReplSet = await MongoMemoryReplSet.create({
//       replSet: { count: 1 }, // 單節點副本集
//     });
//     const uri = mongoReplSet.getUri();

//     await mongoose.connect(uri);

//     console.log("MongoMemoryServer 已啟動並連接");
//   } catch (error) {
//     console.error("MongoMemoryServer 啟動失敗", error);
//     throw error; // 終止測試
//   }
// });

// // 每個測試執行前清空資料庫與 Redis
// beforeEach(async () => {
//   // 清空 MongoDB
//   const collections = mongoose.connection.collections;
//   for (const key in collections) {
//     const collection = collections[key];
//     await collection.deleteMany({});
//   }
//   // 清空 Redis
//   await redisClient.flushall();
// });

// // 在所有測試完成後斷開資料庫連接並停止 MongoMemoryServer
// afterAll(async () => {
//   try {
//     await mongoose.disconnect();
//     await mongoReplSet.stop();
//     await redisClient.quit(); // 關閉 Redis 模擬客戶端
//   } catch (error) {
//     console.error("測試環境清理失敗", error);
//   }
// });