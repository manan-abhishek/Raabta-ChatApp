const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    name: { type: String },
    isGroup: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }
  },
  { timestamps: true }
);

// Index for faster queries
chatRoomSchema.index({ users: 1 });
chatRoomSchema.index({ isGroup: 1 });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
