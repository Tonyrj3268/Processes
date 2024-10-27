// src/models/user.ts

import { Schema, model } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
}

const userSchema: Schema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
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
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export const User = model<IUser>("User", userSchema);
