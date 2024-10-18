// src/models/post.ts

import mongoose, { Document, Schema } from "mongoose";
import { IUserDocument } from "./user";

export interface IPost extends Document {
  user: IUserDocument["_id"];
  content: string;
  createdAt: Date;
  likes: mongoose.Types.ObjectId[];
}

export interface IPostDocument extends IPost, Document {}

const PostSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 280, // twitter限制為 280 字符
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// 添加索引
PostSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IPostDocument>("Post", PostSchema);
