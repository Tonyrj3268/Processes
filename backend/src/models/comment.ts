// src/models/comment.ts

import mongoose, { Document, Schema } from "mongoose";
import { IUserDocument } from "./user";
import { IPostDocument } from "./post";

export interface IComment extends Document {
  user: IUserDocument["_id"];
  post: IPostDocument["_id"];
  content: string;
  createdAt: Date;
}

export interface ICommentDocument extends IComment, Document {}

const CommentSchema: Schema = new Schema({
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

CommentSchema.index({ post: 1, createdAt: -1 });

export default mongoose.model<ICommentDocument>("Comment", CommentSchema);
