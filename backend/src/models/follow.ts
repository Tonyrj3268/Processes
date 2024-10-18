// src/models/Follow.ts

import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user";

export interface IFollow extends Document {
  follower: IUser["_id"];
  following: IUser["_id"];
  createdAt: Date;
}

const FollowSchema: Schema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 防止重複關注，同一組合唯一
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

export default mongoose.model<IFollow>("Follow", FollowSchema);
