import React, { useRef } from 'react';
import { tmdbApi } from '../services/api';
import '../styles/MovieCarousel.css';

const MovieCarousel = ({ title, movies, onMovieClick }) => {
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 620; // Width of card + gap
      carouselRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="card"
              onClick={() => onMovieClick(movie)}
            >
              <img
                src={tmdbApi.getImageUrl(movie.poster_path)}
                alt={movie.title || movie.name}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x450/1a1a1a/fff?text=No+Image';
                }}
              />
              <div className="card-info">
                <h3 className="card-title">{movie.title || movie.name}</h3>
                <div className="card-rating">
                  {movie.vote_average > 0 && (
                    <span>⭐ {movie.vote_average.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
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
