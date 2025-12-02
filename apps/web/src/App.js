import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import MovieList from './components/MovieList';
import TrendingSection from './components/TrendingSection';
import VideoPlayer from './components/VideoPlayer';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [config, setConfig] = useState(null);
  const [activeSection, setActiveSection] = useState('discover');

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
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="main-content">
        {selectedMovie && config ? (
          <VideoPlayer
            movie={selectedMovie}
            config={config}
            onClose={handleClosePlayer}
          />
        ) : (
          <>
            {activeSection === 'discover' && (
              <TrendingSection onMovieClick={handleMovieClick} />
            )}
            
            {activeSection === 'jellyfin' && (
              <div className="jellyfin-section">
                <header className="section-header">
                  <h1>🎬 Films Jellyfin</h1>
                  <p className="subtitle">{movies.length} films disponibles</p>
                </header>
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Chargement des films...</p>
                  </div>
                ) : error ? (
                  <div className="error">
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button onClick={fetchMovies}>Réessayer</button>
                  </div>
                ) : (
                  <MovieList movies={movies} onMovieClick={handleMovieClick} config={config} />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
