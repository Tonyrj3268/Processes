// src/models/comment.ts

import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user";
import { IPost } from "./post";

export interface IComment extends Document {
  user: IUser["_id"];
  post: IPost["_id"];
  content: string;
  createdAt: Date;
}

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

export default mongoose.model<IComment>("Comment", CommentSchema);
