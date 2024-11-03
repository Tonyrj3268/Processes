// src/models/baseContent.ts

import { Schema, Types, model, Document } from "mongoose";

export interface IBaseContent extends Document {
    user: Types.ObjectId;
    content: string;
    createdAt: Date;
    likesCount: number;
    comments: Types.ObjectId[];
    kind: string; // 區分是 Post 還是 Comment
}

const baseContentSchema = new Schema<IBaseContent>(
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
        kind: {
            type: String,
            required: true,
            enum: ["Post", "Comment"],
            index: true,
        },
    },
    { discriminatorKey: "kind", timestamps: true }
);

// 複合索引，適用於按用戶查詢並按創建時間排序
baseContentSchema.index({ user: 1, createdAt: -1 });

export const BaseContent = model<IBaseContent>("BaseContent", baseContentSchema);
