import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../utils/api";
import "./ProfileSettings.css";

const ProfileSettings = ({ onClose }) => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [about, setAbout] = useState(user?.about || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await userAPI.updateProfile({
        username,
        email,
        about,
        avatar,
      });

      const updatedUser = response.data;
      
      // Update local storage and context
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const newUser = { ...storedUser, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUser));
      
      // Update AuthContext state
      if (typeof setUser === 'function') {
        setUser(newUser);
      } else {
        // Fallback if setUser is not exposed (reloading works)
        window.location.reload();
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Profile Settings</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {message.text && (
            <div className={`settings-alert ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="avatar-section">
            <div className="current-avatar">
              {avatar ? (
                <img src={avatar} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="avatar-input">
              <label>Profile Picture</label>
              <div className="avatar-controls">
                <input
                  type="file"
                  id="avatar-file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatar(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: "none" }}
                />
                <button 
                  type="button" 
                  className="upload-btn"
                  onClick={() => document.getElementById('avatar-file').click()}
                >
                  Choose File
                </button>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Or enter Image URL"
                  className="url-input"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>About</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={100}
            />
          </div>

          <div className="settings-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
