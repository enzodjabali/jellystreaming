import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import MyMovies from './pages/MyMovies';
import TVShows from './pages/TVShows';
import Search from './pages/Search';
import Downloads from './pages/Downloads';
import Profile from './pages/Profile';
import Users from './pages/Users';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes with Navbar */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="app">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/movies" element={<MyMovies />} />
                  <Route path="/tvshows" element={<TVShows />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/downloads" element={<Downloads />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route 
                    path="/users" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <Users />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
