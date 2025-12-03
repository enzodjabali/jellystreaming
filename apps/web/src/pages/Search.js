import React, { useState, useEffect, useRef } from 'react';
import { tmdbApi, jellyfinApi } from '../services/api';
import MovieModal from '../components/MovieModal';
import VideoPlayer from '../components/VideoPlayer';
import '../styles/Search.css';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [playingMovie, setPlayingMovie] = useState(null);
  const [jellyfinConfig, setJellyfinConfig] = useState(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    fetchJellyfinConfig();

    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
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
        setSearchResults([]);
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
      const data = await tmdbApi.searchMovies(searchQuery);
      setSearchResults(data.results || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching movies:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMovieClick = async (movie) => {
    try {
      const details = await tmdbApi.getMovieDetails(movie.id);
      setSelectedMovie(details);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handlePlayMovie = (jellyfinMovie) => {
    if (jellyfinMovie) {
      setPlayingMovie(jellyfinMovie);
      setSelectedMovie(null);
    } else {
      alert('This movie is not available in your library');
    }
  };

  const handleClosePlayer = () => {
    setPlayingMovie(null);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
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

  return (
    <div className="search-page">
      <div className="search-container" ref={searchContainerRef}>
        <div className="search-header">
          <h1>Search any movie</h1>
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
              placeholder="Search for a movie..."
              value={searchQuery}
              onChange={handleInputChange}
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
                  setSearchResults([]);
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
          {showSuggestions && searchResults.length > 0 && (
            <div className="search-suggestions">
              {searchResults.slice(0, 8).map((movie) => (
                <div
                  key={movie.id}
                  className="suggestion-item"
                  onClick={() => handleMovieClick(movie)}
                >
                  <div className="suggestion-poster">
                    {movie.poster_path ? (
                      <img
                        src={tmdbApi.getImageUrl(movie.poster_path, 'w92')}
                        alt={movie.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="no-poster">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L8.5 17h11l-3.54-4.71z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <h3 className="suggestion-title">{movie.title}</h3>
                    <div className="suggestion-meta">
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
            </div>
          )}

          {/* No Results */}
          {showSuggestions && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="search-suggestions">
              <div className="no-results">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <p>No movies found for "{searchQuery}"</p>
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
    </div>
  );
};

export default Search;
