const messageRepository = require("../repositories/messageRepository");
const ChatRoom = require("../models/ChatRoom"); // For room verification
const Message = require("../models/Message"); // Add this

class MessageService {
  async sendMessage(senderId, chatRoomId, content, isEncrypted = false, parentMessageId = null, type = "text", voiceUrl = null) {
    if (!chatRoomId || (!content && type !== "voice")) {
      throw new Error("Chat room ID and content are required");
    }

    // Verify chat room exists and user is a member
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      throw new Error("Chat room not found");
    }

    const isMember = chatRoom.users.some(
      (userId) => userId.toString() === senderId.toString()
    );

    if (!isMember) {
      throw new Error("You are not a member of this chat");
    }

    // Create message
    const message = await messageRepository.createMessage({
      sender: senderId,
      chatRoom: chatRoomId,
      content: content || (type === "voice" ? "[Voice Message]" : ""),
      type,
      voiceUrl,
      isEncrypted,
      isRead: false,
      parentMessage: parentMessageId,
    });

    // Update chat room's last message
    chatRoom.lastMessage = message._id;
    await chatRoom.save();

    // Populate message for real-time broadcast
    const populatedMessage = await messageRepository.findMessageById(message._id, [
      { path: "sender", select: "username email avatar" },
      { path: "chatRoom", select: "name isGroup users" },
      { path: "parentMessage", select: "content sender createdAt" },
    ]);

    return { populatedMessage, chatRoom };
  }

  async getChatHistory(userId, chatId, { page = 1, limit = 50 }) {
    // Verify chat room exists and user is a member
    const chatRoom = await ChatRoom.findById(chatId);
    if (!chatRoom) {
      throw new Error("Chat room not found");
    }

    const isMember = chatRoom.users.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error("You are not a member of this chat");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await messageRepository.findMessagesByChatId(chatId, {
      skip,
      limit: parseInt(limit),
      populate: [
        { path: "sender", select: "username email avatar" },
        { path: "parentMessage", select: "content sender createdAt" },
      ],
      userId,
    });

    const total = await messageRepository.countMessagesByChatId(chatId);

    return {
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async addReaction(userId, messageId, emoji) {
    return await messageRepository.addReaction(messageId, userId, emoji);
  }

  async removeReaction(userId, messageId, emoji) {
    return await messageRepository.removeReaction(messageId, userId, emoji);
  }

  async markAsRead(userId, chatId) {
    return await messageRepository.markAsRead(chatId, userId);
  }

  async deleteMessage(userId, messageId, type) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");

    if (type === "everyone") {
      if (message.sender.toString() !== userId.toString()) {
        throw new Error("You can only delete your own messages for everyone");
      }
      return await messageRepository.deleteMessageForEveryone(messageId);
    } else {
      return await messageRepository.deleteMessageForMe(messageId, userId);
    }
  }

  async clearChat(userId, chatId) {
    return await messageRepository.clearChat(chatId, userId);
  }

  async searchMessages(userId, query) {
    if (!query || query.length < 2) {
      throw new Error("Search query must be at least 2 characters");
    }
    return await messageRepository.searchMessages(userId, query);
  }
}

module.exports = new MessageService();
