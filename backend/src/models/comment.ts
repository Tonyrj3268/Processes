// src/models/comment.ts

import { Schema, Types, model, HydratedDocument } from "mongoose";

export interface IComment {
  user: Types.ObjectId;
  post: Types.ObjectId;
  content: string;
  createdAt: Date;
}

export type ICommentDocument = HydratedDocument<IComment>;

const commentSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 280,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

commentSchema.index({ post: 1, createdAt: -1 });

export const Comment = model<IComment>("Comment", commentSchema);
