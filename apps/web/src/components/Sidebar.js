import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'discover', icon: '✨', label: 'Découvrir' },
    { id: 'jellyfin', icon: '🎬', label: 'Films' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🐙</span>
          <span className="logo-text">Jellyseerr</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="status-indicator"></span>
          <span className="status-text">Jellyseerr stable</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
