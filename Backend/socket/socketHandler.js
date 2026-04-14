const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");

const socketHandler = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`✨ Raabta: User connected - ${socket.username} (${socket.userId})`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Emit online status to all users
    io.emit("user-online", { userId: socket.userId });

    // Setup: User comes online (personal room)
    socket.on("setup", (userId) => {
      socket.join(userId);
      socket.emit("connected");
      console.log(`User ${userId} setup complete`);
    });

    // Join chat room
    socket.on("joinChat", async (chatId) => {
      try {
        const chat = await ChatRoom.findById(chatId);
        if (chat && chat.users.some((userId) => userId.toString() === socket.userId)) {
          socket.join(chatId);
          console.log(`User ${socket.userId} joined chat ${chatId}`);
        }
      } catch (error) {
        console.error("Join chat error:", error);
      }
    });

    // Send message
    socket.on("sendMessage", async (message) => {
      try {
        const { chatRoomId, content } = message;

        if (!chatRoomId || !content) {
          socket.emit("error", {
            message: "Chat room ID and content are required",
          });
          return;
        }

        // Verify chat room exists and user is a member
        const chatRoom = await ChatRoom.findById(chatRoomId).populate("users", "username email avatar isOnline");
        if (!chatRoom) {
          socket.emit("error", { message: "Chat room not found" });
          return;
        }

        const isMember = chatRoom.users.some(
          (userId) => userId._id.toString() === socket.userId
        );

        if (!isMember) {
          socket.emit("error", {
            message: "You are not a member of this chat",
          });
          return;
        }

        // Create message
        const newMessage = await Message.create({
          sender: socket.userId,
          chatRoom: chatRoomId,
          content,
          isRead: false,
        });

        // Update chat room's last message
        chatRoom.lastMessage = newMessage._id;
        await chatRoom.save();

        // Populate message
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "username email avatar")
          .populate("chatRoom", "name isGroup users");

        // Emit to all users in the chat room
        io.to(chatRoomId).emit("messageReceived", populatedMessage);

        // Send notifications to other members (if not in chat)
        chatRoom.users.forEach((user) => {
          if (user._id.toString() !== socket.userId) {
            socket.to(user._id.toString()).emit("notification", {
              chatRoomId,
              message: populatedMessage,
              sender: socket.username,
            });
          }
        });
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Error sending message" });
      }
    });

    // Typing indicator
    socket.on("typing", (chatId) => {
      socket.to(chatId).emit("typing", {
        userId: socket.userId,
        username: socket.username,
        chatId,
      });
    });

    // Stop typing indicator
    socket.on("stopTyping", (chatId) => {
      socket.to(chatId).emit("stopTyping", {
        userId: socket.userId,
        username: socket.username,
        chatId,
      });
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`👋 Raabta: User disconnected - ${socket.username} (${socket.userId})`);

      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Emit offline status to all users
      io.emit("user-offline", { userId: socket.userId });
    });
  });
};

module.exports = socketHandler;
