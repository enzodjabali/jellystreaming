const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// TMDB API Functions
export const tmdbApi = {
  getTrending: async (type = 'movie', timeWindow = 'week') => {
    try {
      const response = await fetch(
        `${API_URL}/api/tmdb/trending?type=${type}&time_window=${timeWindow}`
      );
      if (!response.ok) throw new Error('Failed to fetch trending');
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending:', error);
      throw error;
    }
  },

  getPopular: async (page = 1) => {
    try {
      const response = await fetch(
        `${API_URL}/api/tmdb/popular?page=${page}`
      );
      if (!response.ok) throw new Error('Failed to fetch popular movies');
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular:', error);
      throw error;
    }
  },

  getMovieDetails: async (movieId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/tmdb/movie?id=${movieId}`
      );
      if (!response.ok) throw new Error('Failed to fetch movie details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  },

  getGenres: async () => {
    try {
      const response = await fetch(`${API_URL}/api/tmdb/genres`);
      if (!response.ok) throw new Error('Failed to fetch genres');
      return await response.json();
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  discoverMovies: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(
        `${API_URL}/api/tmdb/discover?${queryParams.toString()}`
      );
      if (!response.ok) throw new Error('Failed to discover movies');
      return await response.json();
    } catch (error) {
      console.error('Error discovering movies:', error);
      throw error;
    }
  },

  searchMovies: async (query, page = 1) => {
    try {
      const response = await fetch(
        `${API_URL}/api/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`
      );
      if (!response.ok) throw new Error('Failed to search movies');
      return await response.json();
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  getImageUrl: (path, size = 'w500') => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  },

  getBackdropUrl: (path, size = 'w1280') => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  },
};

// Jellyfin API Functions
export const jellyfinApi = {
  getMovies: async () => {
    try {
      const response = await fetch(`${API_URL}/api/movies`);
      if (!response.ok) throw new Error('Failed to fetch movies');
      const data = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error('Error fetching Jellyfin movies:', error);
      throw error;
    }
  },

  getConfig: async () => {
    try {
      const response = await fetch(`${API_URL}/api/config`);
      if (!response.ok) throw new Error('Failed to fetch config');
      return await response.json();
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  getImageUrl: (movieId, config) => {
    if (!config || !movieId) return null;
    return `${config.jellyfinUrl}/Items/${movieId}/Images/Primary?api_key=${config.apiKey}`;
  },

  getBackdropUrl: (movieId, config) => {
    if (!config || !movieId) return null;
    return `${config.jellyfinUrl}/Items/${movieId}/Images/Backdrop?api_key=${config.apiKey}`;
  },
};
