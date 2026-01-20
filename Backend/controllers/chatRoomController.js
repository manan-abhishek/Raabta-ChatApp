const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Create or get direct (1-to-1) chat
// @route   POST /api/chat/direct
// @access  Private
const createOrGetDirectChat = async (req, res) => {
  try {
    const { userId } = req.body; // Other user's ID

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    // Check if direct chat already exists between these two users
    const existingChat = await ChatRoom.findOne({
      isGroup: false,
      users: { $all: [req.user._id, userId] },
      $expr: { $eq: [{ $size: "$users" }, 2] } // Ensure exactly 2 users
    })
      .populate("users", "username email avatar isOnline")
      .populate("lastMessage");

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new direct chat
    const directChat = await ChatRoom.create({
      name: "", // Direct chats don't need names
      isGroup: false,
      users: [req.user._id, userId],
    });

    const populatedChat = await ChatRoom.findById(directChat._id)
      .populate("users", "username email avatar isOnline")
      .populate("lastMessage");

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error("Create direct chat error:", error);
    res.status(500).json({ message: "Server error creating direct chat" });
  }
};

// @desc    Create group chat
// @route   POST /api/chat/group
// @access  Private
const createGroupChat = async (req, res) => {
  try {
    const { name, userIds } = req.body; // Array of user IDs

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "At least one member is required" });
    }

    // Add current user to the group
    const allUserIds = [...new Set([req.user._id.toString(), ...userIds])];

    const groupChat = await ChatRoom.create({
      name,
      isGroup: true,
      users: allUserIds,
    });

    const populatedChat = await ChatRoom.findById(groupChat._id)
      .populate("users", "username email avatar isOnline")
      .populate("lastMessage");

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error("Create group chat error:", error);
    res.status(500).json({ message: "Server error creating group chat" });
  }
};

// @desc    Get all chats for current user
// @route   GET /api/chat
// @access  Private
const getUserChats = async (req, res) => {
  try {
    const chats = await ChatRoom.find({
      users: req.user._id,
    })
      .populate("users", "username email avatar isOnline")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username avatar",
        },
      })
      .sort({ updatedAt: -1 }); // Most recent first

    // Format response with unread count
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatRoom: chat._id,
          sender: { $ne: req.user._id },
          isRead: false,
        });

        return {
          ...chat.toObject(),
          unreadCount,
        };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    console.error("Get user chats error:", error);
    res.status(500).json({ message: "Server error fetching chats" });
  }
};

// @desc    Get a specific chat
// @route   GET /api/chat/:chatId
// @access  Private
const getChat = async (req, res) => {
  try {
    const chat = await ChatRoom.findById(req.params.chatId)
      .populate("users", "username email avatar isOnline")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username avatar",
        },
      });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of this chat
    const isMember = chat.users.some(
      (user) => user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get unread count
    const unreadCount = await Message.countDocuments({
      chatRoom: chat._id,
      sender: { $ne: req.user._id },
      isRead: false,
    });

    res.json({
      ...chat.toObject(),
      unreadCount,
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({ message: "Server error fetching chat" });
  }
};

module.exports = {
  createOrGetDirectChat,
  createGroupChat,
  getUserChats,
  getChat,
};
