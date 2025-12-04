import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MyMovies from './pages/MyMovies';
import TVShows from './pages/TVShows';
import Search from './pages/Search';
import Downloads from './pages/Downloads';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MyMovies />} />
          <Route path="/tvshows" element={<TVShows />} />
          <Route path="/search" element={<Search />} />
          <Route path="/downloads" element={<Downloads />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
