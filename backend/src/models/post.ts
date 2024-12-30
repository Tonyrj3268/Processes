// src/models/post.ts

import { Schema, Types, model, HydratedDocument } from "mongoose";
import { IUserDocument } from "@src/models/user";
export interface IPost {
  user: Types.ObjectId | IUserDocument;
  content: string;
  images: { type: [string], default: [] },
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  comments: Types.ObjectId[];
  isLiked?: boolean;
}

export type IPostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPostDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 280,
    },
    images: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    likesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: [], // 預設值為空陣列
      },
    ],
  },
  { timestamps: true }
);

// 複合索引，適用於按用戶查詢並按創建時間排序
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1, _id: -1 });

export const Post = model<IPostDocument>("Post", postSchema);
