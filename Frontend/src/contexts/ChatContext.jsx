import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { chatAPI, messageAPI } from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Load user chats
  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await chatAPI.getUserChats();
      setChats(response.data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;

    try {
      const response = await messageAPI.getChatHistory(chatId);
      setMessages((prev) => ({
        ...prev,
        [chatId]: response.data.messages,
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Select a chat
  const selectChat = useCallback(
    async (chat) => {
      setSelectedChat(chat);
      
      // Join chat room via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('joinChat', chat._id);
      }
      
      if (!messages[chat._id]) {
        await loadMessages(chat._id);
      }
      
      // Mark messages as read
      await messageAPI.markAsRead(chat._id);
      
      // Clear notifications for this chat
      setNotifications((prev) =>
        prev.filter((n) => n.chatRoomId !== chat._id)
      );
      
      // Update unread count in chats list
      setChats((prevChats) =>
        prevChats.map((c) =>
          c._id === chat._id ? { ...c, unreadCount: 0 } : c
        )
      );
    },
    [messages, loadMessages]
  );

  // Send a message
  const sendMessage = useCallback(async (chatRoomId, content) => {
    try {
      const response = await messageAPI.sendMessage({
        chatRoomId,
        content,
      });
      const newMessage = response.data;

      // Add to local state
      setMessages((prev) => ({
        ...prev,
        [chatRoomId]: [...(prev[chatRoomId] || []), newMessage],
      }));

      // Update chat's last message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === chatRoomId
            ? { ...chat, lastMessage: newMessage, updatedAt: new Date() }
            : chat
        )
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send message',
      };
    }
  }, []);

  // Create direct chat
  const createDirectChat = useCallback(async (userId) => {
    try {
      const response = await chatAPI.createDirectChat(userId);
      const newChat = response.data;

      // Add to chats if not already present
      setChats((prevChats) => {
        const exists = prevChats.find((chat) => chat._id === newChat._id);
        if (exists) return prevChats;
        return [newChat, ...prevChats];
      });

      return { success: true, chat: newChat };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create chat',
      };
    }
  }, []);

  // Create group chat
  const createGroupChat = useCallback(async (name, userIds) => {
    try {
      const response = await chatAPI.createGroupChat({ name, userIds });
      const newChat = response.data;

      setChats((prevChats) => [newChat, ...prevChats]);

      return { success: true, chat: newChat };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create group chat',
      };
    }
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    // Listen for new messages
    socket.on('messageReceived', (message) => {
      const chatRoomId = message.chatRoom._id || message.chatRoom;

      setMessages((prev) => {
        const existingMessages = prev[chatRoomId] || [];
        // Check if message already exists
        const exists = existingMessages.find((m) => m._id === message._id);
        if (exists) return prev;

        return {
          ...prev,
          [chatRoomId]: [...existingMessages, message],
        };
      });

      // Update chat's last message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === chatRoomId
            ? { ...chat, lastMessage: message, updatedAt: new Date() }
            : chat
        )
      );

      // Update unread count if not selected
      if (selectedChat?._id !== chatRoomId) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === chatRoomId
              ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
              : chat
          )
        );
      }
    });

    // Listen for notifications
    socket.on('notification', (notification) => {
      // Add to notifications list
      setNotifications((prev) => {
        if (prev.find((n) => n.message?._id === notification.message?._id)) {
          return prev;
        }
        return [notification, ...prev];
      });

      // Update unread count
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === notification.chatRoomId
            ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
            : chat
        )
      );
    });

    // Listen for typing indicators
    socket.on('typing', (data) => {
      const chatId = data.chatId || data.chatRoomId;
      if (!chatId) return;
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          [data.userId]: data.username,
        },
      }));
    });

    // Listen for stop typing
    socket.on('stopTyping', (data) => {
      const chatId = data.chatId || data.chatRoomId;
      if (!chatId) return;
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          [data.userId]: null,
        },
      }));
    });

    // Listen for online/offline status
    socket.on('user-online', ({ userId }) => {
      setOnlineUsers((prev) => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });

    socket.on('user-offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Join all chats on connection
    socket.on('connect', () => {
      chats.forEach((chat) => {
        socket.emit('joinChat', chat._id);
      });
    });

    return () => {
      socket.off('messageReceived');
      socket.off('notification');
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('connect');
    };
  }, [isAuthenticated, chats, selectedChat]);

  // Load chats on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated, loadChats]);

  const value = {
    chats,
    selectedChat,
    messages,
    loading,
    typingUsers,
    notifications,
    onlineUsers,
    selectChat,
    sendMessage,
    createDirectChat,
    createGroupChat,
    loadChats,
    loadMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
