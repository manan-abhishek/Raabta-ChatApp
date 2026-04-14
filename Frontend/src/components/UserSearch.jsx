import { useState, useEffect } from 'react';
import { chatAPI, userAPI } from '../utils/api';
import './Modal.css';

const UserSearch = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load all users when component mounts
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const response = await userAPI.getAllUsers();
        setAllUsers(response.data);
        setUsers(response.data);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadAllUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const performSearch = async () => {
        setLoading(true);
        try {
          const response = await chatAPI.searchUsers(searchTerm.trim());
          setUsers(response.data);
        } catch (error) {
          console.error('Search error:', error);
          // Fallback to local filtering if search API fails
          const filtered = allUsers.filter(
            (user) =>
              user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setUsers(filtered);
        } finally {
          setLoading(false);
        }
      };

      const timeoutId = setTimeout(performSearch, 300);
      return () => clearTimeout(timeoutId);
    } else {
      // Show all users when search is empty
      setUsers(allUsers);
    }
  }, [searchTerm, allUsers]);

  // Note: This is a simplified version. In production, you'd need
  // a proper user search API endpoint
  const handleSelect = (user) => {
    onSelect(user);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Search Users</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            autoFocus
          />

          {initialLoading && <div className="loading">Loading users...</div>}
          {loading && !initialLoading && <div className="loading">Searching...</div>}

          {users.length === 0 && !initialLoading && !loading && (
            <div className="no-results">
              {searchTerm ? 'No users found' : 'No users available'}
            </div>
          )}

          <div className="user-list">
            {users.map((user) => (
              <div
                key={user._id}
                className="user-item"
                onClick={() => handleSelect(user)}
              >
                <div className="user-avatar">
                  {user.avatar || user.username?.charAt(0).toUpperCase() || '👤'}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-email">{user.email}</div>
                </div>
                {user.isOnline && <span className="online-indicator">●</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
