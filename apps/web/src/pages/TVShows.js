import React, { useState, useEffect } from 'react';
import { jellyfinTVApi, jellyfinApi } from '../services/api';
import SeriesModal from '../components/SeriesModal';
import SeriesPlayer from '../components/SeriesPlayer';
import '../styles/TVShows.css';

function TVShows() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [playingSeries, setPlayingSeries] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [seriesData, configData] = await Promise.all([
          jellyfinTVApi.getSeries(),
          jellyfinApi.getConfig(),
        ]);
        setSeries(seriesData);
        setConfig(configData);
      } catch (err) {
        console.error('Error fetching TV shows:', err);
        setError('Failed to load TV shows');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSeriesClick = (s) => {
    setSelectedSeries(s);
  };

  const handleCloseModal = () => {
    setSelectedSeries(null);
  };

  const handlePlaySeries = (s) => {
    setPlayingSeries(s);
    setSelectedSeries(null);
  };

  const handleClosePlayer = () => {
    setPlayingSeries(null);
  };

  if (playingSeries) {
    return (
      <SeriesPlayer
        series={playingSeries}
        onClose={handleClosePlayer}
      />
    );
  }

  if (loading) {
    return (
      <div className="tvshows-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading TV shows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tvshows-page">
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tvshows-page">
      <div className="page-header">
        <h1>My TV Shows</h1>
        <span className="series-count">{series.length} Series</span>
      </div>
      
      <div className="series-grid">
        {series.map((s) => (
          <div
            key={s.Id}
            className="series-card"
            onClick={() => handleSeriesClick(s)}
          >
            <div className="series-poster">
              {s.ImageTags && s.ImageTags.Primary ? (
                <img
                  src={jellyfinTVApi.getImageUrl(s.Id, config)}
                  alt={s.Name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Image';
                  }}
                />
              ) : (
                <div className="no-poster">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L8.5 17h11l-3.54-4.71z"/>
                  </svg>
                </div>
              )}
              <div className="series-overlay">
                <button className="play-btn">▶ Watch</button>
              </div>
            </div>
            <div className="series-info">
              <h3 className="series-title">{s.Name}</h3>
              <div className="series-meta">
                {s.ProductionYear && <span className="year">{s.ProductionYear}</span>}
                {s.CommunityRating && (
                  <span className="rating">⭐ {s.CommunityRating.toFixed(1)}</span>
                )}
              </div>
              {s.Status && <span className="status">{s.Status}</span>}
            </div>
          </div>
        ))}
      </div>

      {selectedSeries && (
        <SeriesModal
          series={selectedSeries}
          onClose={handleCloseModal}
          onPlay={handlePlaySeries}
        />
      )}
    </div>
  );
}

export default TVShows;
