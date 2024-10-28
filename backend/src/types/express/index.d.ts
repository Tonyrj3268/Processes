/* eslint-disable @typescript-eslint/no-empty-object-type */
// src/types/express/index.d.ts
import { IUserDocument } from "@src/models/user";

declare global {
  namespace Express {
    interface User extends IUserDocument { }
  }
}
