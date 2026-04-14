import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { chatAPI, messageAPI, userAPI } from "../utils/api";
import { getSocket } from "../utils/socket";
import { useAuth } from "./AuthContext";
import { encryptMessage, decryptMessage } from "../utils/crypto";
import { db, saveUnsentMessage, getUnsentMessages, deleteUnsentMessage } from "../utils/db";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Sync unsent messages when back online
  const syncUnsentMessages = useCallback(async () => {
    if (!navigator.onLine || !token) return;

    const unsent = await getUnsentMessages();
    if (unsent.length === 0) return;

    console.log(`Syncing ${unsent.length} unsent messages...`);

    for (const msg of unsent) {
      try {
        const response = await messageAPI.sendMessage({
          chatRoomId: msg.chatRoomId,
          content: msg.content,
          isEncrypted: msg.isEncrypted,
        });

        if (response.status === 201) {
          await deleteUnsentMessage(msg.id);
          // Optionally update local UI if needed
        }
      } catch (error) {
        console.error("Failed to sync message:", error);
      }
    }
  }, [token]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncUnsentMessages();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncUnsentMessages]);

  // Helper: Decrypt a list of messages
  const decryptMessagesList = useCallback(
    async (messagesList) => {
      const privateKey = localStorage.getItem(`privateKey_${user?._id}`);
      if (!privateKey) return messagesList;

      return await Promise.all(
        messagesList.map(async (msg) => {
          if (msg.isEncrypted) {
            const decryptedContent = await decryptMessage(msg.content, privateKey);
            return { ...msg, content: decryptedContent, isDecrypted: true };
          }
          return msg;
        })
      );
    },
    [user?._id]
  );

  // Load user chats
  const loadChats = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await chatAPI.getUserChats();
      setChats(response.data);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load messages for a chat
  const loadMessages = useCallback(
    async (chatId) => {
      if (!chatId) return;

      try {
        const response = await messageAPI.getChatHistory(chatId);
        const decryptedMessages = await decryptMessagesList(
          response.data.messages
        );
        setMessages((prev) => ({
          ...prev,
          [chatId]: decryptedMessages,
        }));
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    },
    [decryptMessagesList]
  );

  // Select a chat
  const selectChat = useCallback(
    async (chat) => {
      setSelectedChat(chat);

      // Join chat room via socket
      const socket = getSocket();
      if (socket) {
        socket.emit("joinChat", chat._id);
      }

      if (!messages[chat._id]) {
        await loadMessages(chat._id);
      }

      // Mark messages as read
      await messageAPI.markAsRead(chat._id);

      // Clear notifications for this chat
      setNotifications((prev) => prev.filter((n) => n.chatRoomId !== chat._id));

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
  const sendMessage = useCallback(
    async (chatRoomId, content, extra = {}) => {
      try {
        let finalContent = content;
        let isEncrypted = extra.isEncrypted || false;

        // E2EE for 1:1 chats (only for text)
        if (selectedChat && !selectedChat.isGroupChat && !extra.type || extra.type === "text") {
          const recipient = selectedChat.users.find(
            (u) => u._id !== user?._id
          );
          if (recipient && recipient.publicKey) {
            console.log("Encrypting message for recipient...");
            finalContent = await encryptMessage(content, recipient.publicKey);
            isEncrypted = true;
          }
        }

        // Offline Support: If offline, save to IndexedDB and update local UI
        if (!navigator.onLine) {
          console.log("Offline: saving message to IndexedDB");
          const tempId = `temp-${Date.now()}`;
          const unsentMsg = {
            chatRoomId,
            content: finalContent,
            isEncrypted,
            originalContent: content, // Keep original for local display
            ...extra,
          };

          await saveUnsentMessage(unsentMsg);

          const localMsg = {
            _id: tempId,
            sender: { _id: user._id, username: user.username, avatar: user.avatar },
            chatRoom: chatRoomId,
            content: content,
            createdAt: new Date().toISOString(),
            isPending: true, // UI flag to show "sending..." or "offline"
            ...extra,
          };

          setMessages((prev) => ({
            ...prev,
            [chatRoomId]: [...(prev[chatRoomId] || []), localMsg],
          }));

          return { success: true, offline: true };
        }

        const response = await messageAPI.sendMessage({
          chatRoomId,
          content: finalContent,
          isEncrypted,
          ...extra,
        });

        // Update last message in chats list
        setChats((prevChats) =>
          prevChats.map((c) =>
            c._id === chatRoomId ? { ...c, lastMessage: response.data } : c
          )
        );

        return { success: true };
      } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: error.message };
      }
    },
    [selectedChat, user?._id]
  );

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
        error: error.response?.data?.message || "Failed to create chat",
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
        error: error.response?.data?.message || "Failed to create group chat",
      };
    }
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!token) return;

    const socket = getSocket();
    if (!socket) return;

    // Listen for new messages
    const handleMessageReceived = async (message) => {
      const chatRoomId = message.chatRoom._id || message.chatRoom;

      // Decrypt if necessary
      let displayMessage = message;
      if (message.isEncrypted) {
        const privateKey = localStorage.getItem(`privateKey_${user?._id}`);
        if (privateKey) {
          const decryptedContent = await decryptMessage(
            message.content,
            privateKey
          );
          displayMessage = {
            ...message,
            content: decryptedContent,
            isDecrypted: true,
          };
        }
      }

      setMessages((prev) => {
        const existingMessages = prev[chatRoomId] || [];
        // Check if message already exists
        const exists = existingMessages.find((m) => m._id === message._id);
        if (exists) return prev;

        return {
          ...prev,
          [chatRoomId]: [...existingMessages, displayMessage],
        };
      });

      // Update chat's last message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === chatRoomId
            ? {
                ...chat,
                lastMessage: displayMessage,
                updatedAt: new Date(),
              }
            : chat
        )
      );
    };

    socket.on("messageReceived", handleMessageReceived);

    socket.on("messageDeleted", ({ messageId, chatRoomId }) => {
      setMessages((prev) => {
        const existingMessages = prev[chatRoomId] || [];
        return {
          ...prev,
          [chatRoomId]: existingMessages.map((m) =>
            m._id === messageId
              ? { ...m, content: "This message was deleted", type: "text", voiceUrl: null, isDeletedForEveryone: true }
              : m
          ),
        };
      });
    });

    // Listen for notifications
    socket.on("notification", (notification) => {
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
      socket.off("connect");
    };
  }, [token, user?._id, chats, selectedChat, decryptMessagesList, loadChats]);

  // Load chats on mount
  useEffect(() => {
    if (token) {
      loadChats();
    }
  }, [token, loadChats]);

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
    deleteMessageLocal: useCallback(async (messageId, type) => {
      try {
        await messageAPI.deleteMessage(messageId, type);
        
        // Update local state
        if (type === 'me') {
          setMessages(prev => {
            const newMessages = { ...prev };
            Object.keys(newMessages).forEach(chatId => {
              newMessages[chatId] = newMessages[chatId].filter(m => m._id !== messageId);
            });
            return newMessages;
          });
        }
        // 'everyone' is handled via socket event 'messageDeleted'
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, []),
    deleteChatLocal: useCallback(async (chatId) => {
      try {
        await chatAPI.deleteChat(chatId);
        setChats(prev => prev.filter(c => c._id !== chatId));
        if (selectedChat?._id === chatId) setSelectedChat(null);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, [selectedChat]),
    clearChatLocal: useCallback(async (chatId) => {
      try {
        await messageAPI.clearChat(chatId);
        setMessages(prev => ({ ...prev, [chatId]: [] }));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, []),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
