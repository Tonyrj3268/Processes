// src/models/Post.ts

import { BaseContent, IBaseContent } from "@src/models/baseContent";
import { Schema } from "mongoose";

export interface IPost extends IBaseContent {
  postType: string;
}

const postSchema = new Schema({
  // 標記字段以滿足 ESLint 要求
  postType: {
    type: String,
    default: "Post",
  },
});

export const Post = BaseContent.discriminator<IPost>("Post", postSchema);
