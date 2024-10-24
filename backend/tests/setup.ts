// tests/setup.ts
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer;

// 在所有測試之前，啟動 MongoMemoryServer 並建立 MongoDB 連接
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

// 每個測試結束後清除資料庫中的資料
beforeEach(async () => {
  const db = mongoose.connection.db;
  if (db) {
    const collections = await db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// 在所有測試完成後斷開資料庫連接並停止 Mongo 伺服器
afterAll(async () => {
  await mongoose.disconnect(); // 斷開與 MongoDB 的連接
  await mongoServer.stop(); // 停止 MongoMemoryServer
});
