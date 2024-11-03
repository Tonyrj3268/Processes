// src/models/user.ts

import { Schema, model, HydratedDocument } from "mongoose";

export interface IUser {
  accountName: string;
  userName: string;
  email: string;
  password: string;
  followersCount: number;
  followingCount: number;
  isPublic: boolean;
  bio: string;
  avatarUrl: string;
  hasNewNotifications: boolean;
  createdAt?: Date;
  googleId?: string;
}

export type IUserDocument = HydratedDocument<IUser>

const userSchema: Schema = new Schema<IUserDocument>({
  accountName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 30,
  },
  userName: {
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
  isPublic: {
    type: Boolean,
    default: true,
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 160,
  },
  avatarUrl: {
    type: String,
    trim: true,
  },
  hasNewNotifications: {
    type: Boolean,
    default: false,
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

userSchema.index({ accountName: 1 });
userSchema.index({ email: 1 });

export const User = model<IUserDocument>("User", userSchema);
