import React, { useEffect, useState } from 'react';
import { tmdbApi, jellyfinApi, radarrApi } from '../services/api';
import '../styles/MovieModal.css';

const MovieModal = ({ movie, onClose, onPlay }) => {
  const [jellyfinMovie, setJellyfinMovie] = useState(null);
  const [checkingJellyfin, setCheckingJellyfin] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [radarrMovie, setRadarrMovie] = useState(null);
  const [queueItem, setQueueItem] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

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
    let isMounted = true;
    
    // Check if movie exists in Jellyfin and Radarr
    const checkLibraries = async () => {
      try {
        if (!isMounted) return;
        setCheckingJellyfin(true);
        
        // Check Jellyfin
        const movieTitle = movie.title || movie.name;
        const results = await jellyfinApi.searchMovie(movieTitle);
        
        if (results && results.length > 0) {
          // PRIORITY 1: Match by TMDB ID (most reliable)
          const tmdbId = movie.id?.toString();
          let bestMatch = null;
          
          if (tmdbId) {
            bestMatch = results.find(m => m.ProviderIds?.Tmdb === tmdbId);
          }
          
          // FALLBACK: If no TMDB ID match, use title + year matching
          if (!bestMatch) {
            const normalizeTitle = (title) => {
              return title
                .toLowerCase()
                .replace(/[:\-–—]/g, '') // Remove colons, hyphens, dashes
                .replace(/\s+/g, ' ')     // Normalize spaces
                .trim();
            };
            
            const normalizedSearchTitle = normalizeTitle(movieTitle);
            const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
            
            // PRIORITY 2: Exact title + year match
            if (movieYear) {
              bestMatch = results.find(
                m => m.ProductionYear === movieYear && 
                     m.Name.toLowerCase() === movieTitle.toLowerCase()
              );
            }
            
            // PRIORITY 3: Normalized title + year match
            if (!bestMatch && movieYear) {
              bestMatch = results.find(
                m => m.ProductionYear === movieYear && 
                     normalizeTitle(m.Name) === normalizedSearchTitle
              );
            }
            
            // PRIORITY 4: Year match with partial title match
            if (!bestMatch && movieYear) {
              bestMatch = results.find(
                m => m.ProductionYear === movieYear && 
                     normalizeTitle(m.Name).includes(normalizedSearchTitle.split(' ')[0])
              );
            }
            
            // PRIORITY 5: Exact title match (no year check) - only if no year available
            if (!bestMatch && !movieYear) {
              bestMatch = results.find(
                m => m.Name.toLowerCase() === movieTitle.toLowerCase()
              );
            }
            
            // PRIORITY 6: Normalized title match (no year check) - only if no year available
            if (!bestMatch && !movieYear) {
              bestMatch = results.find(
                m => normalizeTitle(m.Name) === normalizedSearchTitle
              );
            }
          }
          
          // If we found a match, use it; otherwise, no match found
          setJellyfinMovie(bestMatch || null);
          
          // Log for debugging
          console.log('Search results for:', movieTitle, movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : '', `[TMDB: ${tmdbId}]`);
          console.log('Found movies:', results.map(m => ({ name: m.Name, year: m.ProductionYear, tmdb: m.ProviderIds?.Tmdb })));
          console.log('Best match:', bestMatch ? `${bestMatch.Name} (${bestMatch.ProductionYear}) [TMDB: ${bestMatch.ProviderIds?.Tmdb}]` : 'No match found');
        } else {
          setJellyfinMovie(null);
        }
      } catch (error) {
        console.error('Error checking Jellyfin library:', error);
        setJellyfinMovie(null);
      } finally {
        if (!isMounted) return;
        setCheckingJellyfin(false);
      }
      
      // Check Radarr for this movie
      try {
        const radarrMovies = await radarrApi.getMovies();
        const radarrMatch = radarrMovies.find(m => m.tmdbId === movie.id);
        
        if (!isMounted) return;
        setRadarrMovie(radarrMatch || null);
        
        // If movie is in Radarr, check queue for download status
        if (radarrMatch) {
          const queue = await radarrApi.getQueue();
          const queueMatch = queue.records?.find(q => q.movieId === radarrMatch.id);
          
          if (!isMounted) return;
          setQueueItem(queueMatch || null);
          
          if (queueMatch && queueMatch.size > 0) {
            const progress = ((queueMatch.size - queueMatch.sizeleft) / queueMatch.size) * 100;
            setDownloadProgress(Math.max(0, Math.min(100, progress)));
          }
        }
      } catch (error) {
        console.error('Error checking Radarr:', error);
      }
    };

    checkLibraries();
    
    return () => {
      isMounted = false;
    };
  }, [movie]);
  
  // Separate useEffect for polling that doesn't depend on radarrMovie/jellyfinMovie
  useEffect(() => {
    if (!radarrMovie || jellyfinMovie) {
      return; // Don't poll if not in Radarr or already in Jellyfin
    }
    
    // Use refs to track current values without triggering re-renders
    const radarrMovieIdRef = { current: radarrMovie.id };
    
    const pollQueue = async () => {
      try {
        // Trigger Radarr to refresh download status
        await radarrApi.refreshMonitoredDownloads();
        
        // First, refresh the Radarr movie data to get updated hasFile status
        const radarrMovies = await radarrApi.getMovies();
        const updatedRadarrMovie = radarrMovies.find(m => m.id === radarrMovieIdRef.current);
        
        if (updatedRadarrMovie) {
          // Update radarrMovie state only if hasFile changed
          if (updatedRadarrMovie.hasFile !== radarrMovie.hasFile) {
            setRadarrMovie(updatedRadarrMovie);
          }
          
          // If movie now has a file, check Jellyfin with full matching logic
          if (updatedRadarrMovie.hasFile) {
            const movieTitle = movie.title || movie.name;
            const results = await jellyfinApi.searchMovie(movieTitle);
            
            if (results && results.length > 0) {
              // PRIORITY 1: Match by TMDB ID (most reliable)
              const tmdbId = movie.id?.toString();
              let bestMatch = null;
              
              if (tmdbId) {
                bestMatch = results.find(m => m.ProviderIds?.Tmdb === tmdbId);
              }
              
              // FALLBACK: If no TMDB ID match, use title + year matching
              if (!bestMatch) {
                const normalizeTitle = (title) => {
                  return title.toLowerCase().replace(/[:\-–—]/g, '').replace(/\s+/g, ' ').trim();
                };
                const normalizedSearchTitle = normalizeTitle(movieTitle);
                const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
                
                // PRIORITY 2: Exact title + year match
                if (movieYear) {
                  bestMatch = results.find(m => m.ProductionYear === movieYear && m.Name.toLowerCase() === movieTitle.toLowerCase());
                }
                
                // PRIORITY 3: Normalized title + year match
                if (!bestMatch && movieYear) {
                  bestMatch = results.find(m => m.ProductionYear === movieYear && normalizeTitle(m.Name) === normalizedSearchTitle);
                }
                
                // PRIORITY 4: Year match with partial title match
                if (!bestMatch && movieYear) {
                  bestMatch = results.find(
                    m => m.ProductionYear === movieYear && 
                         normalizeTitle(m.Name).includes(normalizedSearchTitle.split(' ')[0])
                  );
                }
                
                // PRIORITY 5: Exact title match (no year check) - only if no year available
                if (!bestMatch && !movieYear) {
                  bestMatch = results.find(m => m.Name.toLowerCase() === movieTitle.toLowerCase());
                }
                
                // PRIORITY 6: Normalized title match (no year check) - only if no year available
                if (!bestMatch && !movieYear) {
                  bestMatch = results.find(m => normalizeTitle(m.Name) === normalizedSearchTitle);
                }
              }
              
              if (bestMatch) {
                setJellyfinMovie(bestMatch);
                return; // Stop this poll cycle, interval will be cleared by useEffect cleanup
              }
            }
          }
        }
        
        // Check the queue
        const queue = await radarrApi.getQueue();
        const queueMatch = queue.records?.find(q => q.movieId === radarrMovieIdRef.current);
        
        // Always update queueItem to trigger re-render (create new object reference)
        if (queueMatch) {
          setQueueItem({ ...queueMatch });
          
          if (queueMatch.size > 0) {
            const progress = ((queueMatch.size - queueMatch.sizeleft) / queueMatch.size) * 100;
            setDownloadProgress(Math.max(0, Math.min(100, progress)));
          }
        } else {
          setQueueItem(null);
        }
      } catch (error) {
        console.error('Error polling queue:', error);
      }
    };
    
    // Poll immediately once, then every 5 seconds
    pollQueue();
    const intervalId = setInterval(pollQueue, 5000);
    
    return () => clearInterval(intervalId);
  }, [radarrMovie?.id, jellyfinMovie?.Id, movie.id]);

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

      const result = await radarrApi.addMovie(radarrMovieData);
      
      // Set the Radarr movie so polling starts
      setRadarrMovie(result);
      setDownloadSuccess(true);
      setJustAdded(true);
      
      // Show success message briefly
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 2000);
      
      // Keep justAdded flag for 30 seconds to prevent "Not available" flash
      setTimeout(() => {
        setJustAdded(false);
      }, 30000);
      
      console.log('Movie added to Radarr successfully');
    } catch (error) {
      console.error('Error adding movie to Radarr:', error);
      alert('Failed to add movie to download queue. Please try again.');
    } finally {
      setDownloading(false);
    }
  };
  
  // Determine button state
  const getDownloadButtonState = () => {
    if (jellyfinMovie) {
      return null; // Will show Watch Now button instead
    }
    
    if (downloading) {
      return { text: 'Adding to queue...', disabled: true, progress: 0 };
    }
    
    if (downloadSuccess) {
      return { text: 'Added to queue!', disabled: true, progress: 0, success: true };
    }
    
    // Check if in queue FIRST (before checking hasFile)
    if (queueItem) {
      const status = queueItem.status;
      const progress = downloadProgress;
      
      if (status === 'downloading' || (status === 'queued' && progress > 0)) {
        return { 
          text: `Downloading ${progress.toFixed(0)}%`, 
          disabled: true, 
          progress: progress,
          downloading: true 
        };
      }
      
      if (status === 'queued') {
        return { text: 'In queue...', disabled: true, progress: 0 };
      }
      
      if (status === 'paused') {
        return { text: 'Paused', disabled: true, progress: progress };
      }
      
      if (status === 'completed') {
        return { text: 'Processing...', disabled: true, progress: 100 };
      }
    }
    
    // Check if in Radarr but not in queue
    if (radarrMovie && !queueItem) {
      // If movie has a file, it should be in Jellyfin (processing)
      if (radarrMovie.hasFile) {
        return { text: 'Processing...', disabled: true, progress: 100 };
      }
      // If movie was just added, show "Searching..." instead of "Not available"
      if (justAdded) {
        return { text: 'Searching...', disabled: true, progress: 0 };
      }
      // If movie has no file and is not in queue and wasn't just added, it means Radarr couldn't find it
      return { text: 'Not available', disabled: true, progress: 0, notAvailable: true };
    }
    
    if (checkingJellyfin) {
      return { text: 'Checking library...', disabled: true, progress: 0 };
    }
    
    return { text: 'Download', disabled: false, progress: 0 };
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
            {jellyfinMovie ? (
              <button className="btn btn-primary btn-large" onClick={() => onPlay(jellyfinMovie)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Now
              </button>
            ) : (() => {
              const buttonState = getDownloadButtonState();
              if (!buttonState) return null;
              
              return (
                <button 
                  className={`btn btn-secondary btn-large ${buttonState.downloading ? 'btn-downloading' : ''} ${buttonState.success ? 'btn-success' : ''}`}
                  onClick={handleDownload}
                  disabled={buttonState.disabled}
                  style={{
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {buttonState.progress > 0 && (
                    <div 
                      className="btn-progress-bg"
                      style={{ width: `${buttonState.progress}%` }}
                    />
                  )}
                  <span className="btn-content">
                    {buttonState.downloading ? (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        {buttonState.text}
                      </>
                    ) : buttonState.success ? (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {buttonState.text}
                      </>
                    ) : buttonState.notAvailable ? (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        {buttonState.text}
                      </>
                    ) : buttonState.disabled ? (
                      <>
                        <div className="btn-spinner"></div>
                        {buttonState.text}
                      </>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        {buttonState.text}
                      </>
                    )}
                  </span>
                </button>
              );
            })()}
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
