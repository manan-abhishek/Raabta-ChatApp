const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a new chat room
// @route   POST /api/chat/rooms
// @access  Private
const createRoom = async (req, res) => {
  try {
    const { name, description, type, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const roomData = {
      name,
      description: description || '',
      type: type || 'public',
      createdBy: req.user._id,
      members: [req.user._id],
      admins: [req.user._id],
    };

    // Add members if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      roomData.members = [...new Set([req.user._id.toString(), ...memberIds])];
    }

    // For direct messages, set participants
    if (type === 'direct' && memberIds && memberIds.length === 1) {
      roomData.participants = [req.user._id, memberIds[0]];
      roomData.members = roomData.participants;
    }

    const room = await ChatRoom.create(roomData);
    const populatedRoom = await ChatRoom.findById(room._id)
      .populate('members', 'username email avatar isOnline')
      .populate('createdBy', 'username email avatar')
      .populate('participants', 'username email avatar isOnline');

    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error creating room' });
  }
};

// @desc    Get all rooms for a user
// @route   GET /api/chat/rooms
// @access  Private
const getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      $or: [
        { members: req.user._id },
        { type: 'public' },
      ],
    })
      .populate('members', 'username email avatar isOnline')
      .populate('createdBy', 'username email avatar')
      .populate('participants', 'username email avatar isOnline')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
};

// @desc    Get a specific room
// @route   GET /api/chat/rooms/:roomId
// @access  Private
const getRoom = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId)
      .populate('members', 'username email avatar isOnline')
      .populate('createdBy', 'username email avatar')
      .populate('participants', 'username email avatar isOnline')
      .populate('lastMessage');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member
    const isMember = room.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (room.type === 'private' && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error fetching room' });
  }
};

// @desc    Join a room
// @route   POST /api/chat/rooms/:roomId/join
// @access  Private
const joinRoom = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.type === 'private') {
      return res.status(403).json({ message: 'Cannot join private room' });
    }

    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    const populatedRoom = await ChatRoom.findById(room._id)
      .populate('members', 'username email avatar isOnline')
      .populate('createdBy', 'username email avatar');

    res.json(populatedRoom);
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error joining room' });
  }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { roomId, content, type } = req.body;

    if (!roomId || !content) {
      return res.status(400).json({ message: 'Room ID and content are required' });
    }

    // Check if room exists and user is a member
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = room.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }

    // Create message
    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      content,
      type: type || 'text',
      readBy: [{ user: req.user._id }],
    });

    // Update room's last message
    room.lastMessage = message._id;
    room.lastMessageAt = new Date();
    await room.save();

    // Create notifications for other members
    const otherMembers = room.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );

    const notifications = otherMembers.map((memberId) => ({
      user: memberId,
      type: 'message',
      message: message._id,
      room: roomId,
      from: req.user._id,
    }));

    await Notification.insertMany(notifications);

    // Populate message before sending
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email avatar')
      .populate('room', 'name type');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// @desc    Get messages for a room
// @route   GET /api/chat/rooms/:roomId/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if room exists and user is a member
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = room.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ room: roomId, isDeleted: false })
      .populate('sender', 'username email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Mark messages as read
    await Message.updateMany(
      { room: roomId, 'readBy.user': { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    // Mark notifications as read
    await Notification.updateMany(
      { user: req.user._id, room: roomId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      messages: messages.reverse(),
      page: parseInt(page),
      limit: parseInt(limit),
      total: await Message.countDocuments({ room: roomId, isDeleted: false }),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

// @desc    Get unread notifications
// @route   GET /api/chat/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      isRead: false,
    })
      .populate('message')
      .populate('room', 'name type')
      .populate('from', 'username email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/chat/notifications/:notificationId
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search users
// @route   GET /api/chat/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    })
      .select('username email avatar isOnline')
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
};

// @desc    Get all users (for group chat creation)
// @route   GET /api/chat/users/all
// @access  Private
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
    })
      .select('username email avatar isOnline')
      .limit(100)
      .sort({ username: 1 });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  sendMessage,
  getMessages,
  getNotifications,
  markNotificationRead,
  searchUsers,
  getAllUsers,
};
