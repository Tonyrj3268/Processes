// src/models/event.ts

import { Schema, Types, model, HydratedDocument } from "mongoose";

export interface IEvent {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    eventType: "follow" | "comment" | "like" | "friend_request";
    details: Record<string, unknown>;
    timestamp: Date;

}

export type IEventDocument = HydratedDocument<IEvent>;

const eventSchema: Schema = new Schema({
    sender: { type: Types.ObjectId, required: true },
    receiver: { type: Types.ObjectId, required: true },
    eventType: { type: String, enum: ["follow", "comment", "like", "friend_request"], required: true },
    details: {
        type: Schema.Types.Mixed,
        default: {}
    },
    timestamp: { type: Date, default: Date.now },
});

//可以自動刪除３個月過期的事件，需考慮是否需要
// eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });  // 90天
eventSchema.index({ receiver: 1, timestamp: -1 });
export const Event = model<IEvent>("Event", eventSchema);
