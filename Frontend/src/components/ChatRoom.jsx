import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { getSocket } from "../utils/socket";
import { debounce } from "../utils/debounce";
import EmojiPicker from 'emoji-picker-react';
import "./ChatRoom.css";

const ChatRoom = () => {
  const {
    selectedChat,
    messages,
    sendMessage,
    typingUsers,
    loadMessages,
    loadingHistory,
    onlineUsers,
    deleteMessageLocal,
    deleteChatLocal,
    clearChatLocal,
  } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectionMode, setIsRecordingSelectionMode] = useState(false); // Using a unique name to avoid conflicts

  const [selectedMessageMenu, setSelectedMessageMenu] = useState(null);

  const toggleMessageSelection = (messageId) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleDeleteSelected = async (type) => {
    if (selectedMessages.length === 0) return;
    if (window.confirm(`Delete ${selectedMessages.length} messages?`)) {
      for (const id of selectedMessages) {
        await deleteMessageLocal(id, type);
      }
      setSelectedMessages([]);
      setIsRecordingSelectionMode(false);
    }
  };
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const chatMenuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
      if (selectedMessageMenu && !event.target.closest('.message-menu')) {
        setSelectedMessageMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedMessageMenu]);

  const chatMessages = useMemo(
    () => (selectedChat ? messages[selectedChat._id] || [] : []),
    [selectedChat, messages]
  );

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Check if browser supports mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          await handleSendVoice(base64Audio);
        };
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone access was denied. Please enable microphone permissions in your browser settings to send voice messages.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert("No microphone found on your device.");
      } else {
        alert(`Error accessing microphone: ${err.message}`);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendVoice = async (base64Audio) => {
    if (!selectedChat || sending) return;
    setSending(true);
    try {
      const result = await sendMessage(selectedChat._id, "[Voice Message]", {
        type: "voice",
        voiceUrl: base64Audio,
      });
      if (!result.success) console.error("Failed to send voice:", result.error);
    } catch (error) {
      console.error("Voice send error:", error);
    } finally {
      setSending(false);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const onEmojiClick = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  const handleDeleteMessage = async (messageId, type) => {
    const result = await deleteMessageLocal(messageId, type);
    if (!result.success) alert(result.error);
    setSelectedMessageMenu(null);
  };

  const handleDeleteChat = async () => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      const result = await deleteChatLocal(selectedChat._id);
      if (!result.success) alert(result.error);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear all messages?")) {
      const result = await clearChatLocal(selectedChat._id);
      if (!result.success) alert(result.error);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Debounced stop typing
  const debouncedStopTyping = useCallback(
    debounce((chatId) => {
      const socket = getSocket();
      if (socket) socket.emit("stopTyping", chatId);
    }, 2000),
    []
  );

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessageText(value);

    const socket = getSocket();
    if (!socket || !selectedChat) return;

    if (value.trim().length > 0) {
      socket.emit("typing", selectedChat._id);
      debouncedStopTyping(selectedChat._id);
    } else {
      socket.emit("stopTyping", selectedChat._id);
    }
  };

  const handleScroll = async (e) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && !loadingHistory && selectedChat) {
      // Load more messages if at the top
      console.log("Loading more messages...");
      const currentMessages = messages[selectedChat._id] || [];
      const page = Math.ceil(currentMessages.length / 50) + 1;
      await loadMessages(selectedChat._id, page);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || sending) return;

    setSending(true);

    // Stop typing indicator
    const socket = getSocket();
    if (socket) {
      socket.emit("stopTyping", selectedChat._id);
    }

    const result = await sendMessage(selectedChat._id, messageText.trim());

    if (result.success) {
      setMessageText("");
    }

    setSending(false);
  };

  const formatMessageTime = (date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const formatDateHeader = (date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  const isNewDay = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const getChatName = () => {
    if (!selectedChat) return '';
    if (selectedChat.isGroup) {
      return selectedChat.name;
    }
    const otherUser = selectedChat.users?.find((u) => u._id !== user?._id);
    return otherUser?.username || 'Unknown User';
  };

  const getChatUsers = () => {
    if (!selectedChat) return [];
    return selectedChat.users || [];
  };

  const otherUser = useMemo(() => {
    if (!selectedChat || selectedChat.isGroup) return null;
    return selectedChat.users?.find((u) => u._id !== user?._id);
  }, [selectedChat, user?._id]);

  const isOtherUserOnline = useMemo(() => {
    return otherUser && Array.isArray(onlineUsers) && onlineUsers.includes(otherUser._id);
  }, [otherUser, onlineUsers]);

  // Get typing users for current chat
  const getTypingUsersList = () => {
    if (!selectedChat) return [];
    const chatTypingUsers = typingUsers[selectedChat._id] || {};
    return Object.entries(chatTypingUsers)
      .filter(([userId, username]) => username && userId !== user?._id)
      .map(([userId, username]) => username);
  };

  const typingUsersList = getTypingUsersList();

  if (!selectedChat) {
    return (
      <div className="chat-room-empty">
        <div className="empty-message">
          <h2>Select a chat to start messaging</h2>
          <p>Choose a conversation from the list or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            {selectedChat.isGroup ? '👥' : (
              otherUser?.avatar ? (
                <img src={otherUser.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : '👤'
            )}
          </div>
          <div>
            <div className="chat-header-name">{getChatName()}</div>
            <div className="chat-header-status">
              {selectedChat.isGroup ? (
                `${getChatUsers().length} members`
              ) : (
                <>
                  {isOtherUserOnline ? (
                    <span className="online-status">🟢 Online</span>
                  ) : (
                    <span className="offline-status">⚪ Offline</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="chat-header-actions" ref={chatMenuRef}>
          <button className="menu-btn" onClick={() => setShowChatMenu(!showChatMenu)}>⋮</button>
          {showChatMenu && (
            <div className="chat-dropdown-menu">
              <button onClick={() => {
                setIsRecordingSelectionMode(true);
                setShowChatMenu(false);
              }}>Select Messages</button>
              <button onClick={handleClearChat}>Clear Chat</button>
              <button onClick={handleDeleteChat} className="danger">Delete Chat</button>
            </div>
          )}
        </div>
      </div>

      {isSelectionMode && (
        <div className="selection-bar">
          <span>{selectedMessages.length} selected</span>
          <div className="selection-actions">
            <button onClick={() => handleDeleteSelected('me')}>Delete for me</button>
            <button onClick={() => handleDeleteSelected('everyone')} className="danger">Delete for everyone</button>
            <button onClick={() => {
              setIsRecordingSelectionMode(false);
              setSelectedMessages([]);
            }}>Cancel</button>
          </div>
        </div>
      )}

      <div 
        className="chat-messages"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {loadingHistory && (
          <div className="loading-history">Loading older messages...</div>
        )}
        {chatMessages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Say hi 👋</p>
          </div>
        ) : (
          chatMessages.map((message, index) => {
            const senderId = message.sender?._id || message.sender;
            const isOwn = senderId === user?._id;
            const prevMessage = index > 0 ? chatMessages[index - 1] : null;
            const showDateHeader = isNewDay(message, prevMessage);
            const messageKey = message._id || `temp-${index}-${message.createdAt}`;

            return (
              <div key={messageKey}>
                {showDateHeader && (
                  <div className="date-separator">
                    <span>{formatDateHeader(new Date(message.createdAt))}</span>
                  </div>
                )}
                <div className={`message-wrapper ${isSelectionMode ? 'selection-mode' : ''} ${selectedMessages.includes(message._id) ? 'selected' : ''}`}>
                  {isSelectionMode && (
                    <div className="message-checkbox" onClick={() => toggleMessageSelection(message._id)}>
                      {selectedMessages.includes(message._id) ? 'Γ£à' : 'Γù'}
                    </div>
                  )}
                  <div className={`message ${isOwn ? 'own' : 'other'}`}>
                    {!isOwn && (
                      <div className="message-avatar">
                        {message.sender.avatar ? (
                          <img src={message.sender.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          message.sender.username?.charAt(0).toUpperCase() || '👤'
                        )}
                      </div>
                    )}
                    <div className="message-content">
                      {!isOwn && (
                        <div className="message-sender">{message.sender.username}</div>
                      )}
                      <div className="message-bubble-container">
                        <div 
                          className="message-bubble" 
                          onClick={() => {
                            if (isSelectionMode) {
                              toggleMessageSelection(message._id);
                            } else {
                              setSelectedMessageMenu(selectedMessageMenu === message._id ? null : message._id);
                            }
                          }}
                        >
                          {message.type === "voice" ? (
                            <div className="voice-message">
                              <audio src={message.voiceUrl} controls />
                            </div>
                          ) : (
                            <p>{message.isDeletedForEveryone ? <i>{message.content}</i> : message.content}</p>
                          )}
                          <span className="message-time">
                            {formatMessageTime(new Date(message.createdAt))}
                          </span>
                        </div>
                        {!isSelectionMode && selectedMessageMenu === message._id && !message.isDeletedForEveryone && (
                          <div className="message-menu">
                            <button onClick={() => handleDeleteMessage(message._id, 'me')}>Delete for me</button>
                            {isOwn && (
                              <button onClick={() => handleDeleteMessage(message._id, 'everyone')} className="danger">Delete for everyone</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUsersList.length > 0 && (
          <div className="typing-indicator">
            <span>{typingUsersList.join(', ')} is typing</span>
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-form">
        <div className="emoji-picker-container" ref={emojiPickerRef}>
          <button
            type="button"
            className="emoji-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="emoji-picker-popup">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>
        <button
          type="button"
          className={`record-btn ${isRecording ? "recording" : ""}`}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          title="Hold to record voice message"
        >
          {isRecording ? "🛑" : "🎤"}
        </button>
        {isRecording ? (
          <div className="recording-status animate-pulse">
            Recording... {formatRecordingTime(recordingTime)}
          </div>
        ) : (
          <input
            type="text"
            value={messageText}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="chat-input"
            disabled={sending}
          />
        )}
        <button
          type="submit"
          disabled={sending || (!messageText.trim() && !isRecording)}
          className="send-button"
        >
          {sending ? "..." : "➤"}
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
