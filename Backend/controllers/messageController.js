const messageService = require("../services/messageService");

// @desc    Send a message
// @route   POST /api/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { chatRoomId, content, isEncrypted, parentMessageId, type, voiceUrl } = req.body;
    const { populatedMessage, chatRoom } = await messageService.sendMessage(
      req.user._id,
      chatRoomId,
      content,
      isEncrypted,
      parentMessageId,
      type,
      voiceUrl
    );

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
    res.status(error.message.includes("not found") ? 404 : 400).json({ message: error.message || "Server error sending message" });
  }
};

// @desc    Get chat history
// @route   GET /api/message/:chatId
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page, limit } = req.query;

    const history = await messageService.getChatHistory(req.user._id, chatId, {
      page,
      limit,
    });

    res.status(200).json(history);
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(error.message.includes("not found") ? 404 : 400).json({ message: error.message || "Server error getting chat history" });
  }
};

// @desc    Mark message as read
// @route   PUT /api/message/read/:chatId
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    await messageService.markAsRead(req.user._id, chatId);
    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Server error marking messages as read" });
  }
};

// @desc    Search messages
// @route   GET /api/message/search
// @access  Private
const searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await messageService.searchMessages(req.user._id, query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Search messages error:", error);
    res.status(400).json({ message: error.message || "Server error searching messages" });
  }
};

// @desc    Add reaction to message
// @route   POST /api/message/reaction
// @access  Private
const addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const result = await messageService.addReaction(req.user._id, messageId, emoji);
    
    // Broadcast via socket
    const io = req.app.get("io");
    if (io) {
      io.to(result.chatRoom.toString()).emit("reactionAdded", {
        messageId,
        userId: req.user._id,
        emoji,
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Add reaction error:", error);
    res.status(400).json({ message: error.message || "Server error adding reaction" });
  }
};

// @desc    Delete message
// @route   DELETE /api/message/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type } = req.query; // 'me' or 'everyone'
    const result = await messageService.deleteMessage(req.user._id, messageId, type);

    if (type === "everyone") {
      const io = req.app.get("io");
      if (io) {
        io.to(result.chatRoom.toString()).emit("messageDeleted", {
          messageId,
          chatRoomId: result.chatRoom,
          deletedForEveryone: true,
        });
      }
    }

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(400).json({ message: error.message || "Server error deleting message" });
  }
};

// @desc    Clear chat
// @route   DELETE /api/message/clear/:chatId
// @access  Private
const clearChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    await messageService.clearChat(req.user._id, chatId);
    res.status(200).json({ message: "Chat cleared" });
  } catch (error) {
    console.error("Clear chat error:", error);
    res.status(400).json({ message: error.message || "Server error clearing chat" });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  markAsRead,
  searchMessages,
  addReaction,
  deleteMessage,
  clearChat,
};
