/* eslint-disable @typescript-eslint/no-empty-object-type */
// src/types/express/index.d.ts
import { UserDocument } from "@src/models/user";

declare global {
  namespace Express {
    interface User extends UserDocument {}
  }
}
