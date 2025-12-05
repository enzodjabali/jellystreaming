import React from 'react';
import { JellyfinMovie, JellyfinConfig } from '../types';
import './MovieList.css';

interface MovieListProps {
  movies: JellyfinMovie[];
  onMovieClick: (movie: JellyfinMovie) => void;
  config: JellyfinConfig | null;
}

const MovieList: React.FC<MovieListProps> = ({ movies, onMovieClick, config }) => {
  const getImageUrl = (movie: JellyfinMovie): string | null => {
    if (!config || !movie.ImageTags?.Primary) return null;
    return `${config.jellyfinUrl}/Items/${movie.Id}/Images/Primary?api_key=${config.apiKey}`;
  };

  const getBackdropUrl = (movie: JellyfinMovie): string | null => {
    if (!config || !movie.BackdropImageTags?.[0]) return null;
    return `${config.jellyfinUrl}/Items/${movie.Id}/Images/Backdrop?api_key=${config.apiKey}`;
  };

  const formatRuntime = (ticks: number): string => {
    const minutes = Math.floor(ticks / 600000000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="movie-list">
      <div className="movies-grid">
        {movies.map((movie) => (
          <div
            key={movie.Id}
            className="movie-card"
            onClick={() => onMovieClick(movie)}
          >
            <div className="movie-poster">
              {getImageUrl(movie) ? (
                <img src={getImageUrl(movie)!} alt={movie.Name} />
              ) : (
                <div className="no-poster">
                  <span>🎬</span>
                </div>
              )}
              <div className="movie-overlay">
                <button className="play-button">▶ Play</button>
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
    </div>
  );
};

export default MovieList;
