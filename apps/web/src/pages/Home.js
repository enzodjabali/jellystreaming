import React, { useState, useEffect } from 'react';
import { tmdbApi } from '../services/api';
import MovieCarousel from '../components/MovieCarousel';
import MovieModal from '../components/MovieModal';
import '../styles/Home.css';

const Home = () => {
  const [heroMovie, setHeroMovie] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    fetchMovies();
    
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handlePlayMovie = () => {
    alert('Play functionality to be implemented with video player');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading content...</p>
      </div>
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
          />
        )}

        {popular.length > 0 && (
          <MovieCarousel
            title="Popular Movies"
            movies={popular}
            onMovieClick={handleMovieClick}
          />
        )}

        {actionMovies.length > 0 && (
          <MovieCarousel
            title="Action Movies"
            movies={actionMovies}
            onMovieClick={handleMovieClick}
          />
        )}

        {comedyMovies.length > 0 && (
          <MovieCarousel
            title="Comedy Movies"
            movies={comedyMovies}
            onMovieClick={handleMovieClick}
          />
        )}

        {horrorMovies.length > 0 && (
          <MovieCarousel
            title="Horror Movies"
            movies={horrorMovies}
            onMovieClick={handleMovieClick}
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
