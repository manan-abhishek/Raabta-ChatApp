const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "voice"],
      default: "text",
    },
    voiceUrl: { type: String, default: null },
    isEncrypted: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      },
    ],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDeletedForEveryone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for faster queries
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isRead: 1 });

// Add text index for searching
messageSchema.index({ content: "text" });

module.exports = mongoose.model("Message", messageSchema);
