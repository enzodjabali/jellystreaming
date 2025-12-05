import React, { useState, useEffect } from 'react';
import { jellyfinApi } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import '../styles/MyMovies.css';

import { TMDBMovie, TMDBTVShow, JellyfinMovie, JellyfinSeries, JellyfinConfig, RadarrMovie, RadarrQueueItem, SonarrSeries, SonarrQueueItem, User } from '../types';

const MyMovies = () => {
  const [movies, setMovies] = useState([]);
  const [config, setConfig] = useState<JellyfinConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<JellyfinMovie | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch config and movies in parallel
      const [configData, moviesData] = await Promise.all([
        jellyfinApi.getConfig(),
        jellyfinApi.getMovies()
      ]);

      setConfig(configData);
      setMovies(moviesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie: any) => {
    setSelectedMovie(movie);
  };

  const handleClosePlayer = () => {
    setSelectedMovie(null);
  };

  const formatRuntime = (ticks: number) => {
    const minutes = Math.floor(ticks / 600000000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your movies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (selectedMovie && config) {
    return (
      <VideoPlayer
        movie={selectedMovie}
        config={config}
        onClose={handleClosePlayer}
      />
    );
  }

  return (
    <div className="my-movies">
      <div className="my-movies-header">
        <h1>Movies</h1>
        <p className="subtitle">{movies.length} Movies</p>
      </div>

      <div className="movies-grid">
        {movies.map((movie) => (
          <div
            key={movie.Id}
            className="movie-card"
            onClick={() => handleMovieClick(movie)}
          >
            <div className="movie-poster">
              {movie.ImageTags?.Primary ? (
                <img 
                  src={jellyfinApi.getImageUrl(movie.Id, config)} 
                  alt={movie.Name}
                  loading="lazy"
                />
              ) : (
                <div className="no-poster">
                  <span>🎬</span>
                </div>
              )}
              <div className="movie-overlay">
                <button className="play-button">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="movie-info">
              <h3 className="movie-title">{movie.Name}</h3>
              <div className="movie-meta">
                {movie.ProductionYear && (
                  <span className="year">{movie.ProductionYear}</span>
                )}
                {movie.RunTimeTicks && (
                  <span className="runtime">{formatRuntime(movie.RunTimeTicks)}</span>
                )}
                {movie.CommunityRating && (
                  <span className="rating">⭐ {movie.CommunityRating.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {movies.length === 0 && (
        <div className="empty-state">
          <h2>No movies found</h2>
          <p>Your Jellyfin library appears to be empty.</p>
        </div>
      )}
    </div>
  );
};

export default MyMovies;
