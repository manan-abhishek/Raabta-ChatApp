import { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import './ChatList.css';

const ChatList = ({ onSelectChat, onCreateGroup }) => {
  const { chats, selectedChat, notifications } = useChat();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'group'

  const totalNotifications = notifications.length;

  // Separate direct chats and group chats
  const directChats = chats.filter((chat) => !chat.isGroup);
  const groupChats = chats.filter((chat) => chat.isGroup);

  // Filter chats based on search term
  const filterChats = (chatsToFilter) => {
    return chatsToFilter.filter((chat) => {
      const name = getChatName(chat).toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  };

  const getChatName = (chat) => {
    if (chat.isGroup) {
      return chat.name || 'Unnamed Group';
    }
    const otherUser = chat.users?.find((u) => u._id !== user?._id);
    return otherUser?.username || 'Unknown User';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) {
      return chat.avatar || '👥';
    }
    const otherUser = chat.users?.find((u) => u._id !== user?._id);
    return otherUser?.avatar || '👤';
  };

  const formatMessageTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);

    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM d');
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';

    const message = chat.lastMessage;
    const isOwnMessage = message.sender?._id === user?._id;
    const senderName = isOwnMessage ? 'You' : message.sender?.username;

    // Handle different message types
    let content = message.content;
    if (message.type === 'voice') {
      content = '🎤 Voice message';
    } else if (message.isEncrypted) {
      content = '🔒 Encrypted message';
    } else if (!content) {
      content = 'Media message';
    }

    // For group chats, show sender name. For direct chats, just show message
    if (chat.isGroup) {
      return `${senderName}: ${content}`;
    }
    return content;
  };

  const truncateMessage = (message, maxLength = 30) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const getCurrentChats = () => {
    const chatsToFilter = activeTab === 'direct' ? directChats : groupChats;
    return filterChats(chatsToFilter);
  };

  const currentChats = getCurrentChats();

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

      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeTab === 'direct' ? 'active' : ''}`}
          onClick={() => setActiveTab('direct')}
        >
          <span className="tab-icon">💬</span>
          Direct
        </button>
        <button
          className={`chat-tab ${activeTab === 'group' ? 'active' : ''}`}
          onClick={() => setActiveTab('group')}
        >
          <span className="tab-icon">👥</span>
          Groups
          {groupChats.length > 0 && (
            <span className="tab-count">{groupChats.length}</span>
          )}
        </button>
      </div>

      <div className="chat-search">
        <input
          type="text"
          placeholder={`Search ${activeTab === 'direct' ? 'conversations' : 'groups'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="chat-items">
        {currentChats.length === 0 ? (
          <div className="no-chats">
            {activeTab === 'direct'
              ? searchTerm
                ? 'No conversations found'
                : 'No direct messages yet'
              : searchTerm
              ? 'No groups found'
              : 'No groups yet'}
          </div>
        ) : (
          currentChats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-avatar">
                {chat.isGroup ? (
                  chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} />
                  ) : (
                    '👥'
                  )
                ) : (
                  chat.users?.find((u) => u._id !== user?._id)?.avatar || '👤'
                )}
              </div>
              <div className="chat-info">
                <div className="chat-header">
                  <span className="chat-name">
                    {getChatName(chat)}
                    {chat.isGroup && (
                      <span className="group-member-count">
                        ({chat.users?.length} members)
                      </span>
                    )}
                  </span>
                  {chat.lastMessage && (
                    <span className="chat-time">
                      {formatMessageTime(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="chat-preview">
                  <span className="chat-message">
                    {truncateMessage(getLastMessagePreview(chat), 35)}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              {chat.isGroup && (
                <div className="chat-item-indicator group-indicator" title="Group Chat">
                  👥
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
