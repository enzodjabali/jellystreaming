import React, { useState, useEffect } from 'react';
import './MovieDetails.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const JELLYFIN_URL = process.env.REACT_APP_JELLYFIN_URL || 'https://watch.jellystreaming.ovh';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

function MovieDetails({ movieId, onBack, onWatch }) {
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchMovieDetails();
    fetchRecommendations();
  }, [movieId]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/jellyseerr/movie?id=${movieId}`);
      if (!response.ok) throw new Error('Failed to fetch movie details');
      const data = await response.json();
      setMovie(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching movie details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/jellyseerr/movie/recommendations?id=${movieId}&page=1`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      setRecommendations(data.results || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const handleWatch = async () => {
    if (movie?.mediaInfo?.jellyfinMediaId) {
      // Fetch the Jellyfin movie details to get the full movie object
      try {
        const response = await fetch(`${API_URL}/api/movies`);
        if (!response.ok) throw new Error('Failed to fetch Jellyfin movies');
        const data = await response.json();
        
        // Find the movie by Jellyfin Media ID
        const jellyfinMovie = data.Items?.find(m => m.Id === movie.mediaInfo.jellyfinMediaId);
        
        if (jellyfinMovie && onWatch) {
          // Call the onWatch callback with the Jellyfin movie object
          onWatch(jellyfinMovie);
        } else {
          // Fallback: redirect to Jellyfin if movie not found or no callback
          const jellyfinUrl = `${JELLYFIN_URL}/web/index.html#!/details?id=${movie.mediaInfo.jellyfinMediaId}&context=home&serverId=${movie.mediaInfo.jellyfinMediaId.split('-')[0]}`;
          window.open(jellyfinUrl, '_blank');
        }
      } catch (err) {
        console.error('Error fetching Jellyfin movie:', err);
        // Fallback: redirect to Jellyfin
        const jellyfinUrl = `${JELLYFIN_URL}/web/index.html#!/details?id=${movie.mediaInfo.jellyfinMediaId}&context=home&serverId=${movie.mediaInfo.jellyfinMediaId.split('-')[0]}`;
        window.open(jellyfinUrl, '_blank');
      }
    }
  };

  const handleRequest = async () => {
    if (!movie) return;
    
    setRequesting(true);
    try {
      const requestBody = {
        mediaType: 'movie',
        mediaId: movie.id,
        seasons: [],
      };

      const response = await fetch(`${API_URL}/api/jellyseerr/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create request');
      }

      const data = await response.json();
      alert('✅ Movie request created successfully! You will be notified when it\'s available.');
      
      // Refresh movie details to update status
      fetchMovieDetails();
    } catch (err) {
      console.error('Error creating request:', err);
      alert('❌ Failed to create request: ' + err.message);
    } finally {
      setRequesting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 5: return <span className="status-badge available">Available</span>;
      case 4: return <span className="status-badge partially-available">Partially Available</span>;
      case 3: return <span className="status-badge processing">Processing</span>;
      case 2: return <span className="status-badge pending">Pending</span>;
      default: return null;
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="movie-details-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="movie-details-container">
        <button onClick={onBack} className="back-button">← Back</button>
        <div className="error-message">Error: {error || 'Movie not found'}</div>
      </div>
    );
  }

  const isAvailable = movie.mediaInfo?.status === 5;
  const hasMediaInfo = !!movie.mediaInfo;
  const backdropUrl = movie.backdropPath ? `${TMDB_IMAGE_BASE}/original${movie.backdropPath}` : null;
  const posterUrl = movie.posterPath ? `${TMDB_IMAGE_BASE}/w500${movie.posterPath}` : null;

  return (
    <div className="movie-details-container">
      <button onClick={onBack} className="back-button">← Retour</button>

      {/* Backdrop */}
      {backdropUrl && (
        <div className="movie-backdrop">
          <img src={backdropUrl} alt={movie.title} />
          <div className="backdrop-overlay"></div>
        </div>
      )}

      {/* Main Content */}
      <div className="movie-content">
        <div className="movie-header">
          {posterUrl && (
            <div className="movie-poster">
              <img src={posterUrl} alt={movie.title} />
              {hasMediaInfo && getStatusBadge(movie.mediaInfo.status)}
            </div>
          )}

          <div className="movie-info">
            <h1 className="movie-title">
              {movie.title}
              {movie.releaseDate && (
                <span className="movie-year"> ({new Date(movie.releaseDate).getFullYear()})</span>
              )}
            </h1>

            {movie.tagline && <p className="movie-tagline">{movie.tagline}</p>}

            <div className="movie-meta">
              {movie.voteAverage && (
                <div className="meta-item">
                  <span className="rating-badge">⭐ {movie.voteAverage.toFixed(1)}</span>
                </div>
              )}
              {movie.runtime && (
                <div className="meta-item">
                  <span>🕐 {formatRuntime(movie.runtime)}</span>
                </div>
              )}
              {movie.genres && movie.genres.length > 0 && (
                <div className="meta-item genres">
                  {movie.genres.map((genre, index) => (
                    <span key={genre.id} className="genre-tag">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {isAvailable ? (
                <button onClick={handleWatch} className="btn-watch">
                  ▶ Regarder
                </button>
              ) : (
                <button 
                  onClick={handleRequest} 
                  className="btn-request"
                  disabled={requesting || hasMediaInfo}
                >
                  {requesting ? 'Demande en cours...' : hasMediaInfo ? '✓ Déjà demandé' : '⬇ Demander'}
                </button>
              )}
              {movie.relatedVideos && movie.relatedVideos.length > 0 && (
                <button 
                  onClick={() => window.open(movie.relatedVideos[0].url, '_blank')}
                  className="btn-trailer"
                >
                  🎬 Bande-annonce
                </button>
              )}
            </div>

            {/* Overview */}
            {movie.overview && (
              <div className="movie-overview">
                <h3>Synopsis</h3>
                <p>{movie.overview}</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="movie-additional-info">
          {/* Cast */}
          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <div className="info-section">
              <h2>Distribution</h2>
              <div className="cast-grid">
                {movie.credits.cast.slice(0, 12).map((person) => (
                  <div key={person.id} className="cast-card">
                    {person.profilePath && (
                      <img 
                        src={`${TMDB_IMAGE_BASE}/w185${person.profilePath}`} 
                        alt={person.name}
                      />
                    )}
                    <div className="cast-info">
                      <div className="cast-name">{person.name}</div>
                      <div className="cast-character">{person.character}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Production Info */}
          <div className="info-section production-info">
            <h2>Informations de production</h2>
            <div className="production-grid">
              {movie.releaseDate && (
                <div className="production-item">
                  <strong>Date de sortie:</strong> {formatDate(movie.releaseDate)}
                </div>
              )}
              {movie.budget > 0 && (
                <div className="production-item">
                  <strong>Budget:</strong> {formatCurrency(movie.budget)}
                </div>
              )}
              {movie.revenue > 0 && (
                <div className="production-item">
                  <strong>Revenu:</strong> {formatCurrency(movie.revenue)}
                </div>
              )}
              {movie.productionCompanies && movie.productionCompanies.length > 0 && (
                <div className="production-item">
                  <strong>Studios:</strong> {movie.productionCompanies.map(c => c.name).join(', ')}
                </div>
              )}
              {movie.originalLanguage && (
                <div className="production-item">
                  <strong>Langue originale:</strong> {movie.originalLanguage.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="info-section">
              <h2>Recommandations</h2>
              <div className="recommendations-grid">
                {recommendations.slice(0, 12).map((rec) => (
                  <div 
                    key={rec.id} 
                    className="recommendation-card"
                    onClick={() => window.location.reload()}
                  >
                    {rec.posterPath && (
                      <img 
                        src={`${TMDB_IMAGE_BASE}/w342${rec.posterPath}`} 
                        alt={rec.title}
                      />
                    )}
                    <div className="recommendation-info">
                      <div className="recommendation-title">{rec.title}</div>
                      <div className="recommendation-rating">⭐ {rec.voteAverage?.toFixed(1)}</div>
                    </div>
                    {rec.mediaInfo && getStatusBadge(rec.mediaInfo.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieDetails;
