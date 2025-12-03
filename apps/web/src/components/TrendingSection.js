import React, { useState, useEffect } from 'react';
import './TrendingSection.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const TrendingSection = ({ onMovieClick }) => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [requestStats, setRequestStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch trending movies
      const trendingResponse = await fetch(`${API_URL}/api/jellyseerr/trending?page=1`);
      
      if (!trendingResponse.ok) throw new Error('Failed to fetch trending movies');
      const trendingData = await trendingResponse.json();
      setTrendingMovies(trendingData.results.slice(0, 10));

      // Fetch popular movies
      const popularResponse = await fetch(`${API_URL}/api/jellyseerr/popular?page=1`);
      
      if (!popularResponse.ok) throw new Error('Failed to fetch popular movies');
      const popularData = await popularResponse.json();
      setPopularMovies(popularData.results.slice(0, 10));

      // Fetch request stats
      const statsResponse = await fetch(`${API_URL}/api/jellyseerr/stats`);
      
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      setRequestStats(statsData);

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching Jellyseerr data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = (media) => {
    // Call the onMovieClick callback with the movie ID
    if (onMovieClick) {
      onMovieClick(media.id);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300x450?text=No+Image';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      1: { label: 'Pending', color: '#ffa500' },
      2: { label: 'Approved', color: '#4169e1' },
      3: { label: 'Declined', color: '#dc143c' },
      4: { label: 'Available', color: '#32cd32' },
      5: { label: 'Processing', color: '#9370db' }
    };
    return statusMap[status] || { label: 'Unknown', color: '#808080' };
  };

  if (loading) {
    return (
      <div className="trending-loading">
        <div className="spinner"></div>
        <p>Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trending-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="trending-section">
      <div className="trending-header">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un film ou une série"
            className="search-input"
          />
        </div>
        
        {requestStats && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{requestStats.total}</span>
              <span className="stat-label">Total Requests</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{requestStats.available}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{requestStats.processing}</span>
              <span className="stat-label">Processing</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{requestStats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        )}
      </div>

      <div className="media-category">
        <div className="category-header">
          <h2>Tendances</h2>
          <button className="add-button">
            <span>➕</span>
          </button>
        </div>
        <div className="media-grid">
          {trendingMovies.map((media) => (
            <div
              key={media.id}
              className="media-card"
              onClick={() => handleMediaClick(media)}
            >
              <div className="media-poster">
                <img
                  src={getImageUrl(media.posterPath)}
                  alt={media.title || media.name}
                  loading="lazy"
                />
                {media.mediaInfo && (
                  <div
                    className="status-badge"
                    style={{ background: getStatusBadge(media.mediaInfo.status).color }}
                  >
                    {getStatusBadge(media.mediaInfo.status).label}
                  </div>
                )}
                <div className="media-overlay">
                  <div className="media-info">
                    <h3>{media.title || media.name}</h3>
                    <div className="media-meta">
                      {media.releaseDate && (
                        <span>{new Date(media.releaseDate).getFullYear()}</span>
                      )}
                      {media.voteAverage > 0 && (
                        <span className="rating">⭐ {media.voteAverage.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="media-category">
        <div className="category-header">
          <h2>Films populaires</h2>
          <button className="add-button">
            <span>➕</span>
          </button>
        </div>
        <div className="media-grid">
          {popularMovies.map((media) => (
            <div
              key={media.id}
              className="media-card"
              onClick={() => handleMediaClick(media)}
            >
              <div className="media-poster">
                <img
                  src={getImageUrl(media.posterPath)}
                  alt={media.title || media.name}
                  loading="lazy"
                />
                {media.mediaInfo && (
                  <div
                    className="status-badge"
                    style={{ background: getStatusBadge(media.mediaInfo.status).color }}
                  >
                    {getStatusBadge(media.mediaInfo.status).label}
                  </div>
                )}
                <div className="media-overlay">
                  <div className="media-info">
                    <h3>{media.title || media.name}</h3>
                    <div className="media-meta">
                      {media.releaseDate && (
                        <span>{new Date(media.releaseDate).getFullYear()}</span>
                      )}
                      {media.voteAverage > 0 && (
                        <span className="rating">⭐ {media.voteAverage.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingSection;
