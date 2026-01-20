import { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import './ChatList.css';

const ChatList = ({ onSelectChat, onCreateGroup }) => {
  const { chats, selectedChat, notifications } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Get total notification count
  const totalNotifications = notifications.length;

  const getChatName = (chat) => {
    if (chat.isGroup) {
      return chat.name;
    }
    // For direct chats, show the other user's name
    const otherUser = chat.users?.find((u) => u._id !== user?._id);
    return otherUser?.username || 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) {
      return '👥';
    }
    const otherUser = chat.users?.find((u) => u._id !== user?._id);
    return otherUser?.avatar || '👤';
  };

  const getLastMessage = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    const message = chat.lastMessage;
    const senderName =
      message.sender?._id === user?._id ? 'You' : message.sender?.username;
    return `${senderName}: ${message.content}`;
  };

  const filteredChats = chats.filter((chat) => {
    const name = getChatName(chat).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>
          Chats
          {totalNotifications > 0 && (
            <span className="notification-badge-header">{totalNotifications}</span>
          )}
        </h2>
        <button onClick={onCreateGroup} className="new-group-btn">
          + New Group
        </button>
      </div>

      <div className="chat-search">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="chat-items">
        {filteredChats.length === 0 ? (
          <div className="no-chats">No chats found</div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-avatar">{getChatAvatar(chat)}</div>
              <div className="chat-info">
                <div className="chat-header">
                  <span className="chat-name">{getChatName(chat)}</span>
                  {chat.lastMessage && (
                    <span className="chat-time">
                      {formatDistanceToNow(new Date(chat.lastMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <div className="chat-preview">
                  <span className="chat-message">{getLastMessage(chat)}</span>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">{chat.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
