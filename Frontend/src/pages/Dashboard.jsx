import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import ChatList from '../components/ChatList';
import ChatRoom from '../components/ChatRoom';
import UserSearch from '../components/UserSearch';
import GroupChatModal from '../components/GroupChatModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { selectedChat, selectChat, createDirectChat, createGroupChat } = useChat();
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const handleCreateGroup = () => {
    setShowGroupModal(true);
  };

  const handleUserSelect = async (selectedUser) => {
    const result = await createDirectChat(selectedUser._id);
    if (result.success) {
      selectChat(result.chat);
      setShowUserSearch(false);
    }
  };

  const handleGroupCreate = async (name, userIds) => {
    const result = await createGroupChat(name, userIds);
    if (result.success) {
      selectChat(result.chat);
      setShowGroupModal(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              {user?.avatar || user?.username?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-status">Online</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">
            🚪
          </button>
        </div>

        <div className="sidebar-actions">
          <button
            onClick={() => setShowUserSearch(true)}
            className="new-chat-btn"
          >
            + New Chat
          </button>
        </div>

        <ChatList
          onSelectChat={selectChat}
          onCreateGroup={handleCreateGroup}
        />
      </div>

      <div className="dashboard-main">
        <ChatRoom />
      </div>

      {showUserSearch && (
        <UserSearch
          onSelect={handleUserSelect}
          onClose={() => setShowUserSearch(false)}
        />
      )}

      {showGroupModal && (
        <GroupChatModal
          onCreate={handleGroupCreate}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
