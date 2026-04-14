const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");

class MessageRepository {
  async createMessage(data) {
    return await Message.create(data);
  }

  async findMessageById(id, populate = []) {
    let query = Message.findById(id);
    populate.forEach((p) => {
      query = query.populate(p.path, p.select);
    });
    return await query;
  }

  async findMessagesByChatId(chatId, { skip, limit, populate = [], userId }) {
    let query = Message.find({ 
      chatRoom: chatId,
      deletedFor: { $ne: userId } // Don't show messages deleted for this user
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    populate.forEach((p) => {
      query = query.populate(p.path, p.select);
    });

    return await query;
  }

  async deleteMessageForMe(messageId, userId) {
    return await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );
  }

  async deleteMessageForEveryone(messageId) {
    return await Message.findByIdAndUpdate(
      messageId,
      { 
        isDeletedForEveryone: true,
        content: "This message was deleted",
        type: "text",
        voiceUrl: null
      },
      { new: true }
    ).populate("sender", "username email avatar");
  }

  async clearChat(chatId, userId) {
    return await Message.updateMany(
      { chatRoom: chatId },
      { $addToSet: { deletedFor: userId } }
    );
  }

  async countMessagesByChatId(chatId) {
    return await Message.countDocuments({ chatRoom: chatId });
  }

  async markAsRead(chatId, userId) {
    return await Message.updateMany(
      { chatRoom: chatId, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );
  }

  async searchMessages(userId, query) {
    // Search only in rooms where user is a member
    const userRooms = await ChatRoom.find({ users: userId }).select("_id");
    const roomIds = userRooms.map((r) => r._id);

    return await Message.find({
      chatRoom: { $in: roomIds },
      $text: { $search: query },
      isEncrypted: false, // Cannot search encrypted messages
    })
      .populate("sender", "username email avatar")
      .populate("chatRoom", "name isGroup users")
      .sort({ score: { $meta: "textScore" }, createdAt: -1 });
  }

  async addReaction(messageId, userId, emoji) {
    return await Message.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { user: userId, emoji } } },
      { new: true }
    ).populate("sender", "username email avatar");
  }

  async removeReaction(messageId, userId, emoji) {
    return await Message.findByIdAndUpdate(
      messageId,
      { $pull: { reactions: { user: userId, emoji } } },
      { new: true }
    ).populate("sender", "username email avatar");
  }
}

module.exports = new MessageRepository();
