import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          enum: ["image", "document", "other"],
          default: "other",
        },
        fileSize: {
          type: Number,
        },
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

MessageSchema.index({ chat: 1, createdAt: 1 });

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);

