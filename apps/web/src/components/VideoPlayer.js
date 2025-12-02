import React, { useRef, useEffect } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ movie, config, onClose }) => {
  const videoRef = useRef(null);

  const getStreamUrl = () => {
    // Jellyfin direct stream URL
    return `${config.jellyfinUrl}/Videos/${movie.Id}/stream?Static=true&mediaSourceId=${movie.Id}&api_key=${config.apiKey}`;
  };

  const getSubtitlesUrl = () => {
    if (!movie.HasSubtitles) return null;
    return `${config.jellyfinUrl}/Videos/${movie.Id}/Subtitles/0/Stream.vtt?api_key=${config.apiKey}`;
  };

  const formatRuntime = (ticks) => {
    const minutes = Math.floor(ticks / 600000000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="video-player-container">
      <button className="close-button" onClick={onClose}>
        ✕
      </button>

      <div className="video-wrapper">
        <video
          ref={videoRef}
          controls
          autoPlay
          className="video-element"
          poster={`${config.jellyfinUrl}/Items/${movie.Id}/Images/Backdrop?api_key=${config.apiKey}`}
        >
          <source src={getStreamUrl()} type={`video/${movie.Container}`} />
          {movie.HasSubtitles && (
            <track
              label="Subtitles"
              kind="subtitles"
              srcLang="fr"
              src={getSubtitlesUrl()}
            />
          )}
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="movie-details">
        <h2>{movie.Name}</h2>
        <div className="details-meta">
          {movie.ProductionYear && <span>{movie.ProductionYear}</span>}
          {movie.OfficialRating && <span className="rating-badge">{movie.OfficialRating}</span>}
          {movie.RunTimeTicks && <span>{formatRuntime(movie.RunTimeTicks)}</span>}
          {movie.CommunityRating && (
            <span className="community-rating">
              ⭐ {movie.CommunityRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
