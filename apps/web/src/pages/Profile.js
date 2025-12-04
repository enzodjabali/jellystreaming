import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

function Profile() {
  const { user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'New password must be at least 4 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and security</p>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Username</label>
              <div className="info-value">{user?.username}</div>
            </div>
            <div className="info-item">
              <label>Email</label>
              <div className="info-value">{user?.email || 'Not provided'}</div>
            </div>
            <div className="info-item">
              <label>Account Type</label>
              <div className="info-value">
                <span className={`badge ${user?.isAdmin ? 'badge-admin' : 'badge-user'}`}>
                  {user?.isAdmin ? 'Administrator' : 'User'}
                </span>
              </div>
            </div>
            <div className="info-item">
              <label>Member Since</label>
              <div className="info-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Change Password</h2>
          
          {message.text && (
            <div className={`message message-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
