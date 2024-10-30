// src/models/user.ts

import { Schema, model, HydratedDocument } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  followersCount: number;
  followingCount: number;
  createdAt?: Date;
  googleId?: string;
}

export type IUserDocument = HydratedDocument<IUser>

const userSchema: Schema = new Schema<IUserDocument>({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  // 用戶的粉絲數
  followersCount: {
    type: Number,
    default: 0,
  },
  // 用戶的被關注數
  followingCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  googleId: {
    type: String,
  },
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export const User = model<IUserDocument>("User", userSchema);
