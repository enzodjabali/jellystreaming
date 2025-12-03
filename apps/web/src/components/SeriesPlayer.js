import React, { useState, useEffect } from 'react';
import { jellyfinApi } from '../services/api';
import '../styles/SeriesPlayer.css';

const SeriesPlayer = ({ series, onClose }) => {
  const [config, setConfig] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configData = await jellyfinApi.getConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchSeasons = async () => {
      if (!config || !series) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${config.jellyfinUrl}/Shows/${series.Id}/Seasons?userId=${config.userId}&api_key=${config.apiKey}`
        );
        const data = await response.json();
        
        const seasonList = data.Items || [];
        // Filter out specials (season 0) and sort by season number
        const validSeasons = seasonList
          .filter(s => s.IndexNumber > 0)
          .sort((a, b) => a.IndexNumber - b.IndexNumber);
        
        setSeasons(validSeasons);
        
        // Auto-select first season
        if (validSeasons.length > 0) {
          setSelectedSeason(validSeasons[0]);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, [config, series]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!config || !selectedSeason) return;

      try {
        const response = await fetch(
          `${config.jellyfinUrl}/Shows/${series.Id}/Episodes?seasonId=${selectedSeason.Id}&userId=${config.userId}&api_key=${config.apiKey}`
        );
        const data = await response.json();
        
        const episodeList = (data.Items || []).sort((a, b) => a.IndexNumber - b.IndexNumber);
        setEpisodes(episodeList);
        
        // Auto-select first episode
        if (episodeList.length > 0) {
          setSelectedEpisode(episodeList[0]);
        }
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    };

    fetchEpisodes();
  }, [config, selectedSeason, series]);

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const getVideoUrl = (episode) => {
    if (!config || !episode) return '';
    return `${config.jellyfinUrl}/Videos/${episode.Id}/stream?static=true&api_key=${config.apiKey}`;
  };

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setSelectedEpisode(null);
  };

  const handleEpisodeChange = (episode) => {
    setSelectedEpisode(episode);
  };

  if (loading || !config) {
    return (
      <div className="video-player-overlay">
        <div className="video-player-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-overlay">
      <div className="video-player-container series-player">
        <button className="close-player" onClick={onClose}>×</button>
        
        <div className="series-player-header">
          <h2>{series.Name}</h2>
          {selectedEpisode && (
            <h3>
              S{selectedSeason.IndexNumber}E{selectedEpisode.IndexNumber} - {selectedEpisode.Name}
            </h3>
          )}
        </div>

        <div className="series-player-layout">
          {/* Video Player */}
          <div className="series-video-container">
            {selectedEpisode ? (
              <video
                key={selectedEpisode.Id}
                controls
                autoPlay
                className="video-element"
                src={getVideoUrl(selectedEpisode)}
              >
                <source src={getVideoUrl(selectedEpisode)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="no-episode-selected">
                Select an episode to start watching
              </div>
            )}
          </div>

          {/* Episode Selector Sidebar */}
          <div className="series-sidebar">
            {/* Season Selector */}
            <div className="season-selector">
              <h4>Seasons</h4>
              <div className="season-list">
                {seasons.map((season) => (
                  <button
                    key={season.Id}
                    className={`season-button ${selectedSeason?.Id === season.Id ? 'active' : ''}`}
                    onClick={() => handleSeasonChange(season)}
                  >
                    Season {season.IndexNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode List */}
            <div className="episode-selector">
              <h4>Episodes</h4>
              <div className="episode-list">
                {episodes.map((episode) => (
                  <div
                    key={episode.Id}
                    className={`episode-item ${selectedEpisode?.Id === episode.Id ? 'active' : ''}`}
                    onClick={() => handleEpisodeChange(episode)}
                  >
                    <div className="episode-number">
                      {episode.IndexNumber}
                    </div>
                    <div className="episode-info">
                      <div className="episode-name">{episode.Name}</div>
                      {episode.RunTimeTicks && (
                        <div className="episode-runtime">
                          {Math.round(episode.RunTimeTicks / 600000000)} min
                        </div>
                      )}
                    </div>
                    {episode.UserData?.Played && (
                      <div className="episode-watched">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesPlayer;
