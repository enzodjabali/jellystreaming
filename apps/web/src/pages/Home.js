import React, { useState, useEffect } from 'react';
import { tmdbApi, jellyfinApi } from '../services/api';
import MovieCarousel from '../components/MovieCarousel';
import MovieModal from '../components/MovieModal';
import VideoPlayer from '../components/VideoPlayer';
import '../styles/Home.css';

const Home = () => {
  const [heroMovie, setHeroMovie] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [playingMovie, setPlayingMovie] = useState(null);
  const [jellyfinConfig, setJellyfinConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);

  // Page tracking for infinite scroll
  const [trendingPage, setTrendingPage] = useState(1);
  const [popularPage, setPopularPage] = useState(1);
  const [actionPage, setActionPage] = useState(1);
  const [comedyPage, setComedyPage] = useState(1);
  const [horrorPage, setHorrorPage] = useState(1);

  // Loading states for each carousel
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [popularLoading, setPopularLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comedyLoading, setComedyLoading] = useState(false);
  const [horrorLoading, setHorrorLoading] = useState(false);

  // Has more pages tracking (TMDB typically has max ~500 pages)
  const [trendingHasMore, setTrendingHasMore] = useState(true);
  const [popularHasMore, setPopularHasMore] = useState(true);
  const [actionHasMore, setActionHasMore] = useState(true);
  const [comedyHasMore, setComedyHasMore] = useState(true);
  const [horrorHasMore, setHorrorHasMore] = useState(true);

  useEffect(() => {
    fetchMovies();
    fetchJellyfinConfig();
    
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchJellyfinConfig = async () => {
    try {
      const config = await jellyfinApi.getConfig();
      setJellyfinConfig(config);
    } catch (error) {
      console.error('Error fetching Jellyfin config:', error);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);

      // Fetch trending movies
      const trendingData = await tmdbApi.getTrending('movie', 'week');
      setTrending(trendingData.results || []);
      
      // Set hero movie to the first trending movie
      if (trendingData.results && trendingData.results.length > 0) {
        const heroData = await tmdbApi.getMovieDetails(trendingData.results[0].id);
        setHeroMovie(heroData);
      }

      // Fetch popular movies
      const popularData = await tmdbApi.getPopular();
      setPopular(popularData.results || []);

      // Fetch movies by genre
      const actionData = await tmdbApi.discoverMovies({ with_genres: 28, sort_by: 'popularity.desc' });
      setActionMovies(actionData.results || []);

      const comedyData = await tmdbApi.discoverMovies({ with_genres: 35, sort_by: 'popularity.desc' });
      setComedyMovies(comedyData.results || []);

      const horrorData = await tmdbApi.discoverMovies({ with_genres: 27, sort_by: 'popularity.desc' });
      setHorrorMovies(horrorData.results || []);

    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = async (movie) => {
    try {
      const details = await tmdbApi.getMovieDetails(movie.id);
      setSelectedMovie(details);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handlePlayMovie = (jellyfinMovie) => {
    if (jellyfinMovie) {
      // Movie exists in Jellyfin, play it
      setPlayingMovie(jellyfinMovie);
      setSelectedMovie(null);
    } else {
      // Movie not in Jellyfin (shouldn't happen with current UI)
      alert('This movie is not available in your library');
    }
  };

  const handleClosePlayer = () => {
    setPlayingMovie(null);
  };

  // Load more functions for infinite scroll
  const loadMoreTrending = async () => {
    if (trendingLoading || !trendingHasMore) return;
    
    try {
      setTrendingLoading(true);
      const nextPage = trendingPage + 1;
      const data = await tmdbApi.getTrending('movie', 'week', nextPage);
      
      if (data.results && data.results.length > 0) {
        setTrending(prev => [...prev, ...data.results]);
        setTrendingPage(nextPage);
        
        // Check if we've reached the last page
        if (nextPage >= data.total_pages) {
          setTrendingHasMore(false);
        }
      } else {
        setTrendingHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more trending movies:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  const loadMorePopular = async () => {
    if (popularLoading || !popularHasMore) return;
    
    try {
      setPopularLoading(true);
      const nextPage = popularPage + 1;
      const data = await tmdbApi.getPopular(nextPage);
      
      if (data.results && data.results.length > 0) {
        setPopular(prev => [...prev, ...data.results]);
        setPopularPage(nextPage);
        
        if (nextPage >= data.total_pages) {
          setPopularHasMore(false);
        }
      } else {
        setPopularHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more popular movies:', error);
    } finally {
      setPopularLoading(false);
    }
  };

  const loadMoreAction = async () => {
    if (actionLoading || !actionHasMore) return;
    
    try {
      setActionLoading(true);
      const nextPage = actionPage + 1;
      const data = await tmdbApi.discoverMovies({ 
        with_genres: 28, 
        sort_by: 'popularity.desc',
        page: nextPage 
      });
      
      if (data.results && data.results.length > 0) {
        setActionMovies(prev => [...prev, ...data.results]);
        setActionPage(nextPage);
        
        if (nextPage >= data.total_pages) {
          setActionHasMore(false);
        }
      } else {
        setActionHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more action movies:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const loadMoreComedy = async () => {
    if (comedyLoading || !comedyHasMore) return;
    
    try {
      setComedyLoading(true);
      const nextPage = comedyPage + 1;
      const data = await tmdbApi.discoverMovies({ 
        with_genres: 35, 
        sort_by: 'popularity.desc',
        page: nextPage 
      });
      
      if (data.results && data.results.length > 0) {
        setComedyMovies(prev => [...prev, ...data.results]);
        setComedyPage(nextPage);
        
        if (nextPage >= data.total_pages) {
          setComedyHasMore(false);
        }
      } else {
        setComedyHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more comedy movies:', error);
    } finally {
      setComedyLoading(false);
    }
  };

  const loadMoreHorror = async () => {
    if (horrorLoading || !horrorHasMore) return;
    
    try {
      setHorrorLoading(true);
      const nextPage = horrorPage + 1;
      const data = await tmdbApi.discoverMovies({ 
        with_genres: 27, 
        sort_by: 'popularity.desc',
        page: nextPage 
      });
      
      if (data.results && data.results.length > 0) {
        setHorrorMovies(prev => [...prev, ...data.results]);
        setHorrorPage(nextPage);
        
        if (nextPage >= data.total_pages) {
          setHorrorHasMore(false);
        }
      } else {
        setHorrorHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more horror movies:', error);
    } finally {
      setHorrorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading content...</p>
      </div>
    );
  }

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
    <div className="home">
      {/* Hero Section */}
      {heroMovie && (
        <section 
          className="hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(20,20,20,1)), url(${tmdbApi.getBackdropUrl(heroMovie.backdrop_path, 'original')})`
          }}
        >
          <div className="hero-content">
            <h1 className="hero-title">{heroMovie.title}</h1>
            <div className="hero-meta">
              {heroMovie.genres && heroMovie.genres.slice(0, 3).map(genre => (
                <span key={genre.id} className="tag">{genre.name}</span>
              ))}
            </div>
            <p className="hero-description">{heroMovie.overview}</p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={handlePlayMovie}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedMovie(heroMovie)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                More Info
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Movie Carousels */}
      <div className="content-rows">
        {trending.length > 0 && (
          <MovieCarousel
            title="Trending Now"
            movies={trending}
            onMovieClick={handleMovieClick}
            onLoadMore={loadMoreTrending}
            hasMore={trendingHasMore}
            loading={trendingLoading}
          />
        )}

        {popular.length > 0 && (
          <MovieCarousel
            title="Popular Movies"
            movies={popular}
            onMovieClick={handleMovieClick}
            onLoadMore={loadMorePopular}
            hasMore={popularHasMore}
            loading={popularLoading}
          />
        )}

        {actionMovies.length > 0 && (
          <MovieCarousel
            title="Action Movies"
            movies={actionMovies}
            onMovieClick={handleMovieClick}
            onLoadMore={loadMoreAction}
            hasMore={actionHasMore}
            loading={actionLoading}
          />
        )}

        {comedyMovies.length > 0 && (
          <MovieCarousel
            title="Comedy Movies"
            movies={comedyMovies}
            onMovieClick={handleMovieClick}
            onLoadMore={loadMoreComedy}
            hasMore={comedyHasMore}
            loading={comedyLoading}
          />
        )}

        {horrorMovies.length > 0 && (
          <MovieCarousel
            title="Horror Movies"
            movies={horrorMovies}
            onMovieClick={handleMovieClick}
            onLoadMore={loadMoreHorror}
            hasMore={horrorHasMore}
            loading={horrorLoading}
          />
        )}
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

export default Home;
