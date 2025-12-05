import React, { useRef, useEffect, useState } from 'react';
import { tmdbApi, tmdbTVApi } from '../services/api';
import { TMDBMovie, TMDBTVShow } from '../types';
import '../styles/MovieCarousel.css';

interface MovieCarouselProps {
  title: string;
  movies: (TMDBMovie | TMDBTVShow)[];
  onMovieClick: (movie: TMDBMovie | TMDBTVShow) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  isTVShow?: boolean;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ 
  title, 
  movies, 
  onMovieClick, 
  onLoadMore, 
  hasMore = false, 
  loading = false, 
  isTVShow = false 
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isNearEnd, setIsNearEnd] = useState(false);

  const scrollCarousel = (direction: number) => {
    if (carouselRef.current) {
      const scrollAmount = 620; // Width of card + gap
      carouselRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Check if user scrolled near the end
  const handleScroll = () => {
    if (!carouselRef.current || !onLoadMore || loading) return;

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;

    // If scrolled past 80% and not already loading
    if (scrollPercentage > 0.8 && hasMore && !isNearEnd) {
      setIsNearEnd(true);
      onLoadMore();
    } else if (scrollPercentage <= 0.8) {
      setIsNearEnd(false);
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel && onLoadMore) {
      carousel.addEventListener('scroll', handleScroll);
      return () => carousel.removeEventListener('scroll', handleScroll);
    }
  }, [onLoadMore, loading, hasMore, isNearEnd]);

  return (
    <section className="content-row">
      <h2 className="row-title">{title}</h2>
      <div className="carousel">
        <button 
          className="carousel-btn prev" 
          onClick={() => scrollCarousel(-1)}
          aria-label="Previous"
        >
          &lt;
        </button>
        <div className="carousel-container" ref={carouselRef}>
          {movies.map((movie) => {
            const imageApi = isTVShow ? tmdbTVApi : tmdbApi;
            const posterUrl = imageApi.getImageUrl(movie.poster_path);
            const movieTitle = 'title' in movie ? movie.title : movie.name;
            
            return (
              <div
                key={movie.id}
                className="card"
                onClick={() => onMovieClick(movie)}
              >
                <img
                  src={posterUrl || ''}
                  alt={movieTitle}
                  loading="lazy"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a1a/fff?text=No+Image';
                  }}
                />
                <div className="card-info">
                  <h3 className="card-title">{movieTitle}</h3>
                  <div className="card-rating">
                    {movie.vote_average > 0 && (
                      <span>⭐ {movie.vote_average.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="carousel-loading">
              <div className="spinner"></div>
              <p>Loading more...</p>
            </div>
          )}
        </div>
        <button 
          className="carousel-btn next" 
          onClick={() => scrollCarousel(1)}
          aria-label="Next"
        >
          &gt;
        </button>
      </div>
    </section>
  );
};

export default MovieCarousel;
