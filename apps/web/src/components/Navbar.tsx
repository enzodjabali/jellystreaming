import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

import { TMDBMovie, TMDBTVShow, JellyfinMovie, JellyfinSeries, JellyfinConfig, RadarrMovie, RadarrQueueItem, SonarrSeries, SonarrQueueItem, User } from '../types';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo">JellyStreaming</Link>
        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/search" className={isActive('/search') ? 'active' : ''}>
              Search
            </Link>
          </li>
          <li>
            <Link to="/movies" className={isActive('/movies') ? 'active' : ''}>
              Movies
            </Link>
          </li>
          <li>
            <Link to="/tvshows" className={isActive('/tvshows') ? 'active' : ''}>
              TV Shows
            </Link>
          </li>
          <li>
            <Link to="/downloads" className={isActive('/downloads') ? 'active' : ''}>
              Downloads
            </Link>
          </li>
        </ul>
        <div className="nav-user" ref={dropdownRef}>
          <button 
            className="user-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="user-icon"></span>
            <span className="user-name">{user?.username}</span>
            <span className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>▼</span>
          </button>
          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-username">{user?.username}</div>
                <div className="dropdown-role">
                  {isAdmin ? 'Administrator' : 'User'}
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <Link 
                to="/profile" 
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                Profile Settings
              </Link>
              {isAdmin && (
                <Link 
                  to="/users" 
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  Manage Users
                </Link>
              )}
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
