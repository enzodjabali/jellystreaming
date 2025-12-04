import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Users.css';

function Users() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load users' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading users' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ username: '', email: '', password: '', isAdmin: false });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleEdit = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      isAdmin: user.isAdmin
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const url = modalMode === 'create'
      ? `${API_URL}/api/users`
      : `${API_URL}/api/users/${selectedUser.id}`;

    const method = modalMode === 'create' ? 'POST' : 'PUT';

    const body = modalMode === 'create'
      ? formData
      : {
          email: formData.email || null,
          password: formData.password || null,
          isAdmin: formData.isAdmin
        };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `User ${modalMode === 'create' ? 'created' : 'updated'} successfully` });
        setShowModal(false);
        fetchUsers();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to save user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving user' });
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'User deleted successfully' });
        fetchUsers();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: error || 'Failed to delete user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting user' });
    }
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage system users and permissions</p>
        </div>
        <button className="create-button" onClick={handleCreate}>
          + Create User
        </button>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(user.id, user.username)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Create User' : 'Edit User'}</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="username">Username*</label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                  required
                  disabled={modalMode === 'edit'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  {modalMode === 'create' ? 'Password*' : 'Password (leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={modalMode === 'create' ? 'Enter password' : 'Enter new password'}
                  required={modalMode === 'create'}
                  minLength="4"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  />
                  <span>Administrator</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {modalMode === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
