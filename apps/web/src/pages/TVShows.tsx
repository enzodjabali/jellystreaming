import React, { useState, useEffect } from 'react';
import { jellyfinTVApi, jellyfinApi } from '../services/api';
import SeriesModal from '../components/SeriesModal';
import SeriesPlayer from '../components/SeriesPlayer';
import '../styles/TVShows.css';

import { TMDBMovie, TMDBTVShow, JellyfinMovie, JellyfinSeries, JellyfinConfig, RadarrMovie, RadarrQueueItem, SonarrSeries, SonarrQueueItem, User } from '../types';

function TVShows() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<JellyfinConfig | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<JellyfinSeries | null>(null);
  const [playingSeries, setPlayingSeries] = useState<JellyfinSeries | null>(null);

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

  const handleMoreInfo = (s, e) => {
    e.stopPropagation();
    setSelectedSeries(s);
  };

  const handleCloseModal = () => {
    setSelectedSeries(null);
  };

  const handlePlaySeries = (s, e) => {
    if (e) e.stopPropagation();
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
        <h1>TV Shows</h1>
        <span className="series-count">{series.length} Series</span>
      </div>
      
      <div className="series-grid">
        {series.map((s) => (
          <div
            key={s.Id}
            className="series-card"
          >
            <div className="series-poster">
              {s.ImageTags && s.ImageTags.Primary ? (
                <img
                  src={jellyfinTVApi.getImageUrl(s.Id, config)}
                  alt={s.Name}
                  loading="lazy"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Image';
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
                <button className="watch-btn" onClick={(e) => handlePlaySeries(s, e)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Watch
                </button>
                <button className="info-btn" onClick={(e) => handleMoreInfo(s, e)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  More Info
                </button>
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
