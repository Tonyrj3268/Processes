# 後端開發 TODO

## 初始化項目

- [x] **建立專案目錄**
- 新建專案資料夾`backend`。

- [x] **初始化 npm 項目**

- [x] **安裝 TypeScript 和開發依賴**

  ```bash
    npm install typescript ts-node @types/node --save-dev
  ```

- [x] **初始化 TypeScript 配置**

  ```bash
    npx tsc --init
  ```

## 設定 TypeScript

- [x] **編輯 `tsconfig.json` 文件，確保以下配置**

```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

## 專案結構

- [ ] **建立專案目錄結構**

## 編寫 API 入口

- [ ] **設定伺服器啟動檔案。**
- [ ] **設定 Express 應用程式實例。**
- [ ] **設定中介軟體和路由。**

## 設定中間件

- [ ] **配置中間件**

- `body-parser`：解析請求體。
- `cors`：處理跨域請求。

- [ ] **連接 MongoDB 資料庫**

- 使用 `mongoose.connect()` 連接到 MongoDB。

## 編寫資料模型

- [ ] **建立使用者模型（`src/models/User.ts`）**

- 定義使用者介面 `IUser`。
- 定義使用者 Schema。

- [ ] **建立貼文模型（`src/models/Post.ts`）**

- 定義貼文介面 `IPost`。
- 定義貼文 Schema。

- [ ] **建立關注模型（`src/models/Follow.ts`）**

- 定義關注介面 `IFollow`。
- 定義關注 Schema。

## 編寫中間件

- [ ] **建立驗證中間件（`src/middleware/auth.ts`）**

- 驗證 JWT 令牌。
- 將使用者資訊附加到請求物件。

## 編寫路由

- [ ] **建立使用者認證路由（`src/routes/auth.ts`）**

- 註冊路由：
- 接收使用者名稱、信箱和密碼。
- 驗證使用者是否已存在。
- 哈希密碼並保存用戶。
- 產生並返回 JWT。
- 登入路由：
- 驗證使用者信箱和密碼。
- 產生並返回 JWT。

- [ ] **建立貼文路由（`src/routes/posts.ts`）**

- 建立貼文：
- 驗證使用者身分。
- 接收貼文內容並儲存。
- 取得貼文：
- 驗證使用者身分。
- 傳回所有帖子，按創建時間排序。

- [ ] **建立關注路由（`src/routes/follow.ts`）**

- 關注用戶：
- 驗證使用者身分。
- 檢查是否已追蹤目標使用者。
- 保存關注關係，更新計數。
- 取消追蹤用戶：
- 驗證使用者身分。
- 檢查是否已追蹤目標使用者。
- 刪除關注關係，更新計數。

- [ ] **建立自訂首頁貼文路由（`src/routes/feed.ts`）**

- 取得自訂首頁貼文：
- 驗證使用者身分。
- 從 Redis 快取中取得貼文。
- 如果快取未命中，查詢資料庫並快取結果。

## 設定 Redis 快取

- [ ] **安裝 Redis 用戶端**

- [ ] **建立 Redis 用戶端（`src/utils/redisClient.ts`）**

- [ ] **設定 Redis 連線和錯誤處理。**

- [ ] **在需要的地方使用 Redis**

- 在 `feed` 路由中實作快取邏輯。

## 設定 RabbitMQ 訊息佇列

- [ ] **安裝 RabbitMQ 用戶端**

- [ ] **建立 RabbitMQ 客戶端（`src/utils/rabbitmqClient.ts`）**

- 建立連接和通道。
- 聲明隊列。

- [ ] **在建立貼文時發送訊息**

- 在 `posts` 路由中，貼文建立後向佇列傳送訊息。

- [ ] **創建 RabbitMQ 消費者（`src/worker.ts`）**

- 消費訊息佇列。
- 更新相關使用者的快取。

## 設定環境變數和配置

- [ ] **安裝 dotenv**

- [ ] **建立 `.env` 檔案**

- 儲存敏感資訊（如資料庫連接字串、JWT 金鑰）。

- [ ] **在專案中載入環境變數**

- 在 `src/app.ts` 中使用 `dotenv.config()`。

## 編譯和運行項目

- [ ] **配置 `package.json` 腳本**

```json
"scripts": {
"build": "tsc",
"start": "node dist/server.js",
"dev": "nodemon src/server.ts"
},
```

- [ ] **安裝 Nodemon（可選）**

```bash
npm install nodemon --save-dev
```

- [ ] **運行專案**

- 開發模式：

```bash
npm run dev
```

- 生產模式：

```bash
npm run build
npm start
```

## 程式碼品質和規範

- [ ] **安裝 ESLint 和 Prettier**

```bash
npm install eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev
```

- [ ] **配置 ESLint 和 Prettier**

- 建立 `.eslintrc.js`，設定 TypeScript 解析器和規則。
- 建立 `.prettierrc`，設定程式碼格式化規則。

- [ ] **在專案中使用 ESLint 和 Prettier**

- 在編輯器中集成，或在 `package.json` 中新增腳本：

```json
"lint": "eslint 'src/**/*.{ts,tsx}'",
"format": "prettier --write 'src/**/*.{ts,tsx}'"
```

## 測試

- [ ] **安裝測試框架**

```bash
npm install jest ts-jest @types/jest supertest @types/supertest --save-dev
```

- [ ] **配置 Jest**

- 建立 `jest.config.js`，設定 TypeScript 支援。

- [ ] **編寫測試案例**

- 在 `tests/` 目錄下撰寫單元測試和整合測試。

- [ ] **在 `package.json` 中新增測試腳本**

```json
"test": "jest"
```

## 版本控制與協作

- [ ] **初始化 Git 倉庫**

```bash
git init
```

- [ ] **建立 `.gitignore` 檔案**

- 忽略 `node_modules/`、`dist/`、`.env` 等檔案。

- [ ] **撰寫專案文件**

- 更新 `README.md`，新增專案簡介、安裝和執行指南。

## 進一步功能開發

- [ ] **實作推薦演算法**

- 收集使用者行為資料。
- 實作協同過濾或內容過濾演算法。
- 在 `recommend` 路由中傳回推薦貼文。

- [ ] **優化效能**

- 資料庫索引和查詢最佳化。
- 使用快取策略（Redis）。
- 程式碼和依賴優化。

- [ ] **安全性增強**

- 使用 HTTPS。
- 資料輸入驗證和清理。
- 實現速率限制和安全頭部。

- [ ] **日誌與監控**

- 整合日誌記錄系統。
- 設定效能監控和警報。
