// src/models/comment.ts

import { Schema, Types, model, HydratedDocument } from "mongoose";

export interface IComment {
  user: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  comments: Types.ObjectId[];
}

export type ICommentDocument = HydratedDocument<IComment>;

const commentSchema = new Schema<ICommentDocument>(
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
      },
    ],
  },
);

// 複合索引，適用於按用戶查詢並按創建時間排序
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });

export const Comment = model<ICommentDocument>("Comment", commentSchema);
