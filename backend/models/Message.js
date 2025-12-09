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
      required: false, // Allow empty text if attachments exist
      trim: true,
      default: "",
      validate: {
        validator: function(value) {
          // Either text or attachments must be present
          const hasText = value && value.trim().length > 0;
          const hasAttachments = this.attachments && this.attachments.length > 0;
          return hasText || hasAttachments;
        },
        message: "Message must have either text or attachments",
      },
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

