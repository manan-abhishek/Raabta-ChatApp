import { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { getSocket } from '../utils/socket';
import './ChatRoom.css';

const ChatRoom = () => {
  const { selectedChat, messages, sendMessage, typingUsers, onlineUsers } = useChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatMessages = selectedChat ? messages[selectedChat._id] || [] : [];

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Join chat room when selected
  useEffect(() => {
    if (selectedChat) {
      const socket = getSocket();
      if (socket) {
        socket.emit('joinChat', selectedChat._id);
      }
    }
  }, [selectedChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || sending) return;

    setSending(true);
    
    // Stop typing indicator
    const socket = getSocket();
    if (socket) {
      socket.emit('stopTyping', selectedChat._id);
    }
    
    const result = await sendMessage(selectedChat._id, messageText.trim());

    if (result.success) {
      setMessageText('');
    }

    setSending(false);
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessageText(value);

    const socket = getSocket();
    if (!socket || !selectedChat) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim().length > 0) {
      // Emit typing
      socket.emit('typing', selectedChat._id);

      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', selectedChat._id);
      }, 2000);
    } else {
      // Stop typing if input is empty
      socket.emit('stopTyping', selectedChat._id);
    }
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

  const getOtherUser = () => {
    if (!selectedChat || selectedChat.isGroup) return null;
    return selectedChat.users?.find((u) => u._id !== user?._id);
  };

  const otherUser = getOtherUser();
  const isOtherUserOnline = otherUser && onlineUsers.includes(otherUser._id);

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
            {selectedChat.isGroup ? '👥' : '👤'}
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
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Say hi 👋</p>
          </div>
        ) : (
          chatMessages.map((message, index) => {
            const isOwn = message.sender._id === user?._id;
            const prevMessage = index > 0 ? chatMessages[index - 1] : null;
            const showDateHeader = isNewDay(message, prevMessage);

            return (
              <div key={message._id}>
                {showDateHeader && (
                  <div className="date-separator">
                    <span>{formatDateHeader(new Date(message.createdAt))}</span>
                  </div>
                )}
                <div className={`message ${isOwn ? 'own' : 'other'}`}>
                  {!isOwn && (
                    <div className="message-avatar">
                      {message.sender.avatar || message.sender.username?.charAt(0).toUpperCase() || '👤'}
                    </div>
                  )}
                  <div className="message-content">
                    {!isOwn && (
                      <div className="message-sender">{message.sender.username}</div>
                    )}
                    <div className="message-bubble">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {formatMessageTime(new Date(message.createdAt))}
                      </span>
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
        <input
          type="text"
          value={messageText}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="chat-input"
          disabled={sending}
        />
        <button 
          type="submit" 
          disabled={sending || !messageText.trim()} 
          className="send-button"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
