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
    const { name, userIds, description, avatar } = req.body; // Array of user IDs

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "At least one member is required" });
    }

    // Add current user to the group and set as admin
    const allUserIds = [...new Set([req.user._id.toString(), ...userIds])];

    const groupChat = await ChatRoom.create({
      name,
      description: description || "",
      avatar: avatar || "",
      isGroup: true,
      users: allUserIds,
      admin: req.user._id, // Set creator as admin
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

// @desc    Get chat members
// @route   GET /api/chat/:chatId/members
// @access  Private
const getChatMembers = async (req, res) => {
  try {
    const chat = await ChatRoom.findById(req.params.chatId)
      .populate("users", "username email avatar isOnline lastSeen")
      .populate("admin", "username email avatar");

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

    const members = chat.users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      role: chat.admin && chat.admin._id.toString() === user._id.toString() ? "admin" : "member",
    }));

    res.json(members);
  } catch (error) {
    console.error("Get chat members error:", error);
    res.status(500).json({ message: "Server error fetching members" });
  }
};

// @desc    Update group (rename, update avatar, description)
// @route   PUT /api/chat/:chatId
// @access  Private (Admin only for group)
const updateGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, description, avatar } = req.body;

    const chat = await ChatRoom.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of this chat
    const isMember = chat.users.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // For groups, only admin can update
    if (chat.isGroup && chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can update group settings" });
    }

    // Update fields
    if (name !== undefined) chat.name = name;
    if (description !== undefined) chat.description = description;
    if (avatar !== undefined) chat.avatar = avatar;

    await chat.save();

    const updatedChat = await ChatRoom.findById(chatId)
      .populate("users", "username email avatar isOnline")
      .populate("lastMessage");

    res.json(updatedChat);
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({ message: "Server error updating group" });
  }
};

// @desc    Add member to group
// @route   POST /api/chat/:chatId/members
// @access  Private (Admin only)
const addMember = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const chat = await ChatRoom.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if chat is a group
    if (!chat.isGroup) {
      return res.status(400).json({ message: "Can only add members to group chats" });
    }

    // Only admin can add members
    if (chat.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Check if user is already a member
    if (chat.users.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    chat.users.push(userId);
    await chat.save();

    const updatedChat = await ChatRoom.findById(chatId)
      .populate("users", "username email avatar isOnline")
      .populate("lastMessage");

    res.json(updatedChat);
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ message: "Server error adding member" });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/chat/:chatId/members/:userId
// @access  Private (Admin only, or user can remove themselves)
const removeMember = async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    const chat = await ChatRoom.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if chat is a group
    if (!chat.isGroup) {
      return res.status(400).json({ message: "Can only remove members from group chats" });
    }

    // Check if user is the admin or the user being removed
    const isAdmin = chat.admin.toString() === req.user._id.toString();
    const isSelf = userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Only admin can remove other members" });
    }

    // Cannot remove admin
    if (userId === chat.admin.toString()) {
      return res.status(400).json({ message: "Cannot remove admin from group" });
    }

    chat.users = chat.users.filter((id) => id.toString() !== userId);
    await chat.save();

    const updatedChat = await ChatRoom.findById(chatId)
      .populate("users", "username email avatar isOnline")
      .populate("lastMessage");

    res.json(updatedChat);
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ message: "Server error removing member" });
  }
};

// @desc    Leave group
// @route   POST /api/chat/:chatId/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await ChatRoom.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of this chat
    const isMember = chat.users.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this chat" });
    }

    // If user is admin and there are other members, prevent leaving
    if (chat.admin.toString() === req.user._id.toString() && chat.users.length > 1) {
      return res.status(400).json({ message: "Admin cannot leave group. Transfer admin role first or delete the group." });
    }

    // Remove user from the chat
    chat.users = chat.users.filter(
      (userId) => userId.toString() !== req.user._id.toString()
    );

    // If no users left, delete the chat
    if (chat.users.length === 0) {
      await ChatRoom.findByIdAndDelete(chatId);
      await Message.deleteMany({ chatRoom: chatId });
      return res.json({ message: "Group deleted successfully" });
    }

    // If admin leaves, assign new admin
    if (chat.admin.toString() === req.user._id.toString()) {
      chat.admin = chat.users[0];
    }

    await chat.save();

    res.json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({ message: "Server error leaving group" });
  }
};

// @desc    Delete/Leave chat
// @route   DELETE /api/chat/:chatId
// @access  Private
const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await ChatRoom.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Remove user from the chat
    chat.users = chat.users.filter(
      (userId) => userId.toString() !== req.user._id.toString()
    );

    // If no users left, or it's a direct chat and one user "deletes" it
    // In a real app, you might want to keep direct chats but hide them
    // For now, if a user leaves, they are just removed from the participants

    if (chat.users.length === 0) {
      await ChatRoom.findByIdAndDelete(chatId);
      // Also delete all messages in this chat
      await Message.deleteMany({ chatRoom: chatId });
    } else {
      await chat.save();
    }

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ message: "Server error deleting chat" });
  }
};

module.exports = {
  createOrGetDirectChat,
  createGroupChat,
  getUserChats,
  getChat,
  getChatMembers,
  updateGroup,
  addMember,
  removeMember,
  leaveGroup,
  deleteChat,
};
