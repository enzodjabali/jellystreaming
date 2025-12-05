import React, { useState, useEffect, useRef } from 'react';
import { tmdbApi, tmdbTVApi, jellyfinApi } from '../services/api';
import MovieModal from '../components/MovieModal';
import SeriesModal from '../components/SeriesModal';
import VideoPlayer from '../components/VideoPlayer';
import SeriesPlayer from '../components/SeriesPlayer';
import '../styles/Search.css';

import { TMDBMovie, TMDBTVShow, JellyfinMovie, JellyfinSeries, JellyfinConfig, RadarrMovie, RadarrQueueItem, SonarrSeries, SonarrQueueItem, User } from '../types';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [tvResults, setTVResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<TMDBTVShow | null>(null);
  const [playingMovie, setPlayingMovie] = useState<JellyfinMovie | null>(null);
  const [playingSeries, setPlayingSeries] = useState<JellyfinSeries | null>(null);
  const [jellyfinConfig, setJellyfinConfig] = useState<JellyfinConfig | null>(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    fetchJellyfinConfig();

    // Close suggestions when clicking outside
    const handleClickOutside = (event: any) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setMovieResults([]);
        setTVResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchJellyfinConfig = async () => {
    try {
      const config = await jellyfinApi.getConfig();
      setJellyfinConfig(config);
    } catch (error) {
      console.error('Error fetching Jellyfin config:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    try {
      setIsSearching(true);
      
      // Search both movies and TV shows with individual error handling
      const [moviesData, tvData] = await Promise.all([
        tmdbApi.searchMovies(searchQuery).catch(err => {
          console.error('Error searching movies:', err);
          return { results: [] };
        }),
        tmdbTVApi.searchTV(searchQuery).catch(err => {
          console.error('Error searching TV shows:', err);
          return { results: [] };
        })
      ]);
      
      setMovieResults(moviesData.results || []);
      setTVResults(tvData.results || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching:', error);
      setMovieResults([]);
      setTVResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMovieClick = async (movie: any) => {
    try {
      const details = await tmdbApi.getMovieDetails(movie.id);
      setSelectedMovie(details);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  const handleSeriesClick = async (series: any) => {
    try {
      const details = await tmdbTVApi.getTVDetails(series.id);
      setSelectedSeries(details);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error fetching series details:', error);
    }
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
    setSelectedSeries(null);
  };

  const handlePlayMovie = (jellyfinMovie: any) => {
    if (jellyfinMovie) {
      setPlayingMovie(jellyfinMovie);
      setSelectedMovie(null);
    } else {
      alert('This movie is not available in your library');
    }
  };

  const handlePlaySeries = (jellyfinSeries: any) => {
    if (jellyfinSeries) {
      setPlayingSeries(jellyfinSeries);
      setSelectedSeries(null);
    } else {
      alert('This series is not available in your library');
    }
  };

  const handleClosePlayer = () => {
    setPlayingMovie(null);
    setPlayingSeries(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (movieResults.length > 0 || tvResults.length > 0) {
      setShowSuggestions(true);
    }
  };

  // If playing a movie, show the video player
  if (playingMovie && jellyfinConfig) {
    return (
      <VideoPlayer
        movie={playingMovie}
        config={jellyfinConfig}
        onClose={handleClosePlayer}
      />
    );
  }

  // If playing a series, show the series player
  if (playingSeries) {
    return (
      <SeriesPlayer
        series={playingSeries}
        onClose={handleClosePlayer}
      />
    );
  }

  return (
    <div className="search-page">
      <div className="search-container" ref={searchContainerRef}>
        <div className="search-header">
          <h1>Search movies & TV shows</h1>
        </div>

        <div className="search-box">
          <div className="search-input-wrapper">
            <svg 
              className="search-icon" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search for movies or TV shows..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
              onFocus={handleInputFocus}
              autoFocus
            />
            {isSearching && (
              <div className="search-loading">
                <div className="spinner-small"></div>
              </div>
            )}
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => {
                  setSearchQuery('');
                  setMovieResults([]);
                  setTVResults([]);
                  setShowSuggestions(false);
                  searchInputRef.current?.focus();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (movieResults.length > 0 || tvResults.length > 0) && (
            <div className="search-suggestions">
              {/* Movies Section */}
              {movieResults.length > 0 && (
                <>
                  <div className="suggestion-category">Movies</div>
                  {movieResults.slice(0, 5).map((movie) => (
                    <div
                      key={`movie-${movie.id}`}
                      className="suggestion-item"
                      onClick={() => handleMovieClick(movie)}
                    >
                      {movie.poster_path && (
                        <div className="suggestion-poster">
                          <img
                            src={tmdbApi.getImageUrl(movie.poster_path, 'w92')}
                            alt={movie.title}
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="suggestion-info">
                        <h3 className="suggestion-title">{movie.title}</h3>
                        <div className="suggestion-meta">
                          <span className="suggestion-type">Movie</span>
                          {movie.release_date && (
                            <span className="suggestion-year">
                              {new Date(movie.release_date).getFullYear()}
                            </span>
                          )}
                          {movie.vote_average > 0 && (
                            <span className="suggestion-rating">
                              ⭐ {movie.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* TV Shows Section */}
              {tvResults.length > 0 && (
                <>
                  <div className="suggestion-category">TV Shows</div>
                  {tvResults.slice(0, 5).map((series) => (
                    <div
                      key={`tv-${series.id}`}
                      className="suggestion-item"
                      onClick={() => handleSeriesClick(series)}
                    >
                      {series.poster_path && (
                        <div className="suggestion-poster">
                          <img
                            src={tmdbTVApi.getImageUrl(series.poster_path, 'w92')}
                            alt={series.name}
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="suggestion-info">
                        <h3 className="suggestion-title">{series.name}</h3>
                        <div className="suggestion-meta">
                          <span className="suggestion-type">TV Show</span>
                          {series.first_air_date && (
                            <span className="suggestion-year">
                              {new Date(series.first_air_date).getFullYear()}
                            </span>
                          )}
                          {series.vote_average > 0 && (
                            <span className="suggestion-rating">
                              ⭐ {series.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* No Results */}
          {showSuggestions && searchQuery.trim().length >= 2 && movieResults.length === 0 && tvResults.length === 0 && !isSearching && (
            <div className="search-suggestions">
              <div className="no-results">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <p>No movies or TV shows found for "{searchQuery}"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={handleCloseModal}
          onPlay={handlePlayMovie}
        />
      )}

      {/* Series Modal */}
      {selectedSeries && (
        <SeriesModal
          series={selectedSeries}
          onClose={handleCloseModal}
          onPlay={handlePlaySeries}
        />
      )}
    </div>
  );
};

export default Search;
