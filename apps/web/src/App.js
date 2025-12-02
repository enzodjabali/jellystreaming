import React, { useState, useEffect } from 'react';
import './App.css';
import MovieList from './components/MovieList';
import VideoPlayer from './components/VideoPlayer';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchConfig();
    fetchMovies();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/config`);
      if (!response.ok) throw new Error('Failed to fetch config');
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/movies`);
      if (!response.ok) throw new Error('Failed to fetch movies');
      const data = await response.json();
      setMovies(data.Items || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleClosePlayer = () => {
    setSelectedMovie(null);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchMovies}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 JellyStreaming</h1>
        <p className="subtitle">{movies.length} movies available</p>
      </header>

      {selectedMovie && config ? (
        <VideoPlayer
          movie={selectedMovie}
          config={config}
          onClose={handleClosePlayer}
        />
      ) : (
        <MovieList movies={movies} onMovieClick={handleMovieClick} config={config} />
      )}
    </div>
  );
}

export default App;
