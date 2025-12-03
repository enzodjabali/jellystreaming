import React, { useEffect, useState } from 'react';
import { tmdbApi, jellyfinApi, radarrApi } from '../services/api';
import '../styles/MovieModal.css';

const MovieModal = ({ movie, onClose, onPlay }) => {
  const [jellyfinMovie, setJellyfinMovie] = useState(null);
  const [checkingJellyfin, setCheckingJellyfin] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    // Check if movie exists in Jellyfin
    const checkJellyfinLibrary = async () => {
      try {
        setCheckingJellyfin(true);
        const movieTitle = movie.title || movie.name;
        const results = await jellyfinApi.searchMovie(movieTitle);
        
        if (results && results.length > 0) {
          // Normalize titles for better matching
          const normalizeTitle = (title) => {
            return title
              .toLowerCase()
              .replace(/[:\-–—]/g, '') // Remove colons, hyphens, dashes
              .replace(/\s+/g, ' ')     // Normalize spaces
              .trim();
          };
          
          const normalizedSearchTitle = normalizeTitle(movieTitle);
          
          // Try to find exact match first
          let bestMatch = results.find(
            m => m.Name.toLowerCase() === movieTitle.toLowerCase()
          );
          
          // If no exact match, try normalized matching
          if (!bestMatch) {
            bestMatch = results.find(
              m => normalizeTitle(m.Name) === normalizedSearchTitle
            );
          }
          
          // Also check by year if available
          if (!bestMatch && movie.release_date) {
            const movieYear = new Date(movie.release_date).getFullYear();
            bestMatch = results.find(
              m => m.ProductionYear === movieYear && 
                   normalizeTitle(m.Name).includes(normalizedSearchTitle.split(' ')[0])
            );
          }
          
          // Fall back to first result if still no match
          setJellyfinMovie(bestMatch || results[0]);
          
          // Log for debugging
          console.log('Search results for:', movieTitle);
          console.log('Found movies:', results.map(m => ({ name: m.Name, year: m.ProductionYear })));
          console.log('Best match:', bestMatch ? bestMatch.Name : 'Using first result');
        } else {
          setJellyfinMovie(null);
        }
      } catch (error) {
        console.error('Error checking Jellyfin library:', error);
        setJellyfinMovie(null);
      } finally {
        setCheckingJellyfin(false);
      }
    };

    checkJellyfinLibrary();
  }, [movie]);

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal')) {
      onClose();
    }
  };

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleAddToList = () => {
    alert('Add to list functionality to be implemented');
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Get root folders to use the first one
      const rootFolders = await radarrApi.getRootFolders();
      const rootFolderPath = rootFolders && rootFolders.length > 0 
        ? rootFolders[0].path 
        : '/movies';

      // Prepare movie data for Radarr
      const radarrMovieData = {
        title: movie.title || movie.name,
        qualityProfileId: 1, // Default quality profile
        titleSlug: movie.title ? movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'unknown',
        images: movie.poster_path ? [{
          coverType: 'poster',
          url: tmdbApi.getImageUrl(movie.poster_path, 'original')
        }] : [],
        tmdbId: movie.id,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
        rootFolderPath: rootFolderPath,
        monitored: true,
        addOptions: {
          searchForMovie: true
        }
      };

      await radarrApi.addMovie(radarrMovieData);
      setDownloadSuccess(true);
      
      // Show success message
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3000);
      
      console.log('Movie added to Radarr successfully');
    } catch (error) {
      console.error('Error adding movie to Radarr:', error);
      alert('Failed to add movie to download queue. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: movie.overview,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      alert('Share functionality not supported in this browser');
    }
  };

  return (
    <div className="modal active" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        
        <div className="modal-header">
          <img
            src={tmdbApi.getBackdropUrl(movie.backdrop_path || movie.poster_path, 'w1280')}
            alt={movie.title}
            className="modal-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/1280x720/1a1a1a/fff?text=No+Image';
            }}
          />
        </div>

        <div className="modal-body">
          <h2 id="modal-title">{movie.title || movie.name}</h2>
          
          <div className="modal-meta">
            {movie.vote_average > 0 && (
              <>
                <span className="rating">★ {movie.vote_average.toFixed(1)}</span>
                <span>•</span>
              </>
            )}
            {movie.runtime && (
              <>
                <span>{formatRuntime(movie.runtime)}</span>
                <span>•</span>
              </>
            )}
            {movie.release_date && (
              <>
                <span>{new Date(movie.release_date).getFullYear()}</span>
                <span>•</span>
              </>
            )}
            {movie.genres && movie.genres.slice(0, 3).map((genre, index) => (
              <span key={genre.id} className="tag">{genre.name}</span>
            ))}
          </div>

          <p className="modal-description">
            {movie.overview || 'No description available.'}
          </p>

          <div className="modal-actions">
            {checkingJellyfin ? (
              <button className="btn btn-secondary btn-large" disabled>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                Checking library...
              </button>
            ) : jellyfinMovie ? (
              <button className="btn btn-primary btn-large" onClick={() => onPlay(jellyfinMovie)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Now
              </button>
            ) : (
              <button 
                className="btn btn-secondary btn-large" 
                onClick={handleDownload}
                disabled={downloading || downloadSuccess}
              >
                {downloading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Adding to queue...
                  </>
                ) : downloadSuccess ? (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Added to queue!
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </>
                )}
              </button>
            )}
          </div>

          <div className="modal-secondary">
            <button className="btn-text" onClick={handleAddToList}>
              + Add to My List
            </button>
            <button className="btn-text" onClick={handleShare}>
              Share
            </button>
          </div>

          {movie.credits && movie.credits.cast && movie.credits.cast.length > 0 && (
            <div className="modal-cast">
              <h3>Cast</h3>
              <div className="cast-list">
                {movie.credits.cast.slice(0, 5).map((person) => (
                  <div key={person.id} className="cast-member">
                    {person.profile_path ? (
                      <img
                        src={tmdbApi.getImageUrl(person.profile_path, 'w185')}
                        alt={person.name}
                      />
                    ) : (
                      <div className="cast-placeholder">?</div>
                    )}
                    <p className="cast-name">{person.name}</p>
                    <p className="cast-character">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {movie.similar && movie.similar.results && movie.similar.results.length > 0 && (
            <div className="modal-similar">
              <h3>Similar Movies</h3>
              <div className="similar-list">
                {movie.similar.results.slice(0, 6).map((similar) => (
                  <div key={similar.id} className="similar-item">
                    <img
                      src={tmdbApi.getImageUrl(similar.poster_path, 'w185')}
                      alt={similar.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/185x278/1a1a1a/fff?text=No+Image';
                      }}
                    />
                    <p>{similar.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
