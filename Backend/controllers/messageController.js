const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");

// @desc    Send a message
// @route   POST /api/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { chatRoomId, content } = req.body;

    if (!chatRoomId || !content) {
      return res.status(400).json({ message: "Chat room ID and content are required" });
    }

    // Verify chat room exists and user is a member
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    const isMember = chatRoom.users.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this chat" });
    }

    // Create message
    const message = await Message.create({
      sender: req.user._id,
      chatRoom: chatRoomId,
      content,
      isRead: false, // Not read by other members yet
    });

    // Update chat room's last message
    chatRoom.lastMessage = message._id;
    await chatRoom.save();

    // Populate message before sending
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username email avatar")
      .populate("chatRoom", "name isGroup users");

    // Broadcast via Socket.IO if available
    const io = req.app.get("io");
    if (io) {
      // Emit to chat room
      io.to(chatRoomId.toString()).emit("messageReceived", populatedMessage);

      // Notifications to other members
      chatRoom.users.forEach((userId) => {
        if (userId.toString() !== req.user._id.toString()) {
          io.to(userId.toString()).emit("notification", {
            chatRoomId,
            message: populatedMessage,
          });
        }
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error sending message" });
  }
};

// @desc    Get chat history
// @route   GET /api/message/:chatId
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify chat room exists and user is a member
    const chatRoom = await ChatRoom.findById(chatId);
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    const isMember = chatRoom.users.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this chat" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ chatRoom: chatId })
      .populate("sender", "username email avatar")
      .sort({ createdAt: -1 }) // Most recent first
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Message.countDocuments({ chatRoom: chatId });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ message: "Server error fetching chat history" });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/message/read/:chatId
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify chat room exists and user is a member
    const chatRoom = await ChatRoom.findById(chatId);
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    const isMember = chatRoom.users.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this chat" });
    }

    // Mark all unread messages in this chat as read (except own messages)
    const result = await Message.updateMany(
      {
        chatRoom: chatId,
        sender: { $ne: req.user._id },
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      message: "Messages marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res.status(500).json({ message: "Server error marking messages as read" });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  markMessagesAsRead,
};
