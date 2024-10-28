// src/models/Follow.ts

import { Schema, Types, model, Model, HydratedDocument } from "mongoose";

export interface IFollow extends Document {
  follower: Types.ObjectId;
  following: Types.ObjectId;
  createdAt: Date;
}

export type IFollowDocument = HydratedDocument<IFollow>
export type IFollowModel = Model<IFollowDocument>

const followSchema: Schema = new Schema({
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
followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = model<IFollow>("Follow", followSchema);
