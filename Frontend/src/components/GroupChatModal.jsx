import { useState, useEffect } from 'react';
import { chatAPI } from '../utils/api';
import './Modal.css';

const GroupChatModal = ({ onCreate, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await chatAPI.getAllUsers();
        setAvailableUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleCreate = () => {
    if (groupName.trim() && selectedUsers.length > 0) {
      onCreate(groupName.trim(), selectedUsers);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Group Chat</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Select Members</label>
            <div className="user-selection">
              {loading ? (
                <div className="loading">Loading users...</div>
              ) : availableUsers.length === 0 ? (
                <div className="no-results">No users available</div>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`user-select-item ${
                      selectedUsers.includes(user._id) ? 'selected' : ''
                    }`}
                    onClick={() => toggleUser(user._id)}
                  >
                    <div className="user-avatar">
                      {user.avatar || user.username?.charAt(0).toUpperCase() || '👤'}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.username}</div>
                      {user.isOnline && <span className="online-indicator">●</span>}
                    </div>
                    {selectedUsers.includes(user._id) && (
                      <span className="check-mark">✓</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!groupName.trim() || selectedUsers.length === 0}
              className="btn-primary"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChatModal;
