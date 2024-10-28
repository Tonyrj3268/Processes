// src/models/post.ts

import { Schema, Types, model, HydratedDocument } from "mongoose";

export interface IPost {
  user: Types.ObjectId;
  content: string;
  createdAt: Date;
  likes: Types.ObjectId[];
}

export type IPostDocument = HydratedDocument<IPost>

const postSchema: Schema = new Schema({
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
postSchema.index({ user: 1, createdAt: -1 });

export const Post = model<IPost>("Post", postSchema);
