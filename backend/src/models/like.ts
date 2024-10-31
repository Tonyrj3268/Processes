// src/models/like.ts

import { Schema, Types, model, HydratedDocument } from "mongoose";

export interface ILike {
    user: Types.ObjectId;
    targetModel: "Post" | "Comment";
    target: Types.ObjectId;
    createdAt: Date;
}

export type ILikeDocument = HydratedDocument<ILike>;

const likeSchema = new Schema<ILike>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        targetModel: {
            type: String,
            enum: ["Post", "Comment"],
            required: true,
            index: true,
        },
        target: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }
);

// 複合索引，用於高效查詢用戶對特定目標的點讚狀態
likeSchema.index({ user: 1, targetModel: 1, target: 1 }, { unique: true });

export const Like = model<ILike>("Like", likeSchema);
