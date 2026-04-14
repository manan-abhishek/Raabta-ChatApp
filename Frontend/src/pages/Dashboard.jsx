import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import ChatList from "../components/ChatList";
import ChatRoom from "../components/ChatRoom";
import UserSearch from "../components/UserSearch";
import GroupChatModal from "../components/GroupChatModal";
import ThemeToggle from "../components/ThemeToggle";
import ProfileSettings from "../components/ProfileSettings";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { selectedChat, selectChat, createDirectChat, createGroupChat } =
    useChat();
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
          <div 
            className="user-info" 
            onClick={() => setShowSettings(true)}
            style={{ cursor: "pointer" }}
            title="Edit Profile"
          >
            <div className="user-avatar">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} 
                />
              ) : (
                user?.username?.charAt(0).toUpperCase() || "👤"
              )}
            </div>
            <div className="user-details">
              <h3>{user?.username}</h3>
              <div className="user-status">Online</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <ThemeToggle />
            <button onClick={logout} className="logout-btn" title="Logout">
              🚪
            </button>
          </div>
        </div>

        <div className="sidebar-actions">
          <button
            onClick={() => setShowUserSearch(true)}
            className="new-chat-btn"
          >
            <span>+</span> New Chat
          </button>
        </div>

        <ChatList onSelectChat={selectChat} onCreateGroup={handleCreateGroup} />
      </div>

      <div className="dashboard-main">
        {selectedChat ? (
          <ChatRoom />
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <h2>Welcome to Raabta</h2>
            <p>Select a chat from the sidebar to start messaging or search for new friends.</p>
          </div>
        )}
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

      {showSettings && (
        <ProfileSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Dashboard;
