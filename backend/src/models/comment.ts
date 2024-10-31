// src/models/Comment.ts

import { BaseContent, IBaseContent } from "@src/models/baseContent";
import { Schema, Types } from "mongoose";

export interface IComment extends IBaseContent {
  post: Types.ObjectId;
  commentType: string;
}

const commentSchema = new Schema({
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true,
    index: true, // 為了加速基於 post 的查詢
  },
  commentType: {
    type: String,
    default: "Comment",
  },
});

// 複合索引，適用於按 Post 查詢 Comments 並按創建時間排序
commentSchema.index({ post: 1, createdAt: -1 });

export const Comment = BaseContent.discriminator<IComment>("Comment", commentSchema);
