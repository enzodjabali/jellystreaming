const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// TMDB API Functions
export const tmdbApi = {
  getTrending: async (type = 'movie', timeWindow = 'week', page = 1) => {
    try {
      const response = await fetch(
        `${API_URL}/api/tmdb/trending?type=${type}&time_window=${timeWindow}&page=${page}`
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
      const response = await fetch(`${API_URL}/api/jellyfin/movies`);
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

  searchMovie: async (title) => {
    try {
      const response = await fetch(
        `${API_URL}/api/jellyfin/movies/search?title=${encodeURIComponent(title)}`
      );
      if (!response.ok) throw new Error('Failed to search movie');
      const data = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error('Error searching movie:', error);
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

// Radarr API Functions
export const radarrApi = {
  addMovie: async (movieData) => {
    try {
      const response = await fetch(`${API_URL}/api/radarr/movie`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add movie to Radarr: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding movie to Radarr:', error);
      throw error;
    }
  },

  getQueue: async (page = 1, pageSize = 50) => {
    try {
      const response = await fetch(
        `${API_URL}/api/radarr/queue?page=${page}&pageSize=${pageSize}`
      );
      if (!response.ok) throw new Error('Failed to fetch Radarr queue');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Radarr queue:', error);
      throw error;
    }
  },

  getMovies: async () => {
    try {
      const response = await fetch(`${API_URL}/api/radarr/movies`);
      if (!response.ok) throw new Error('Failed to fetch Radarr movies');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Radarr movies:', error);
      throw error;
    }
  },

  getRootFolders: async () => {
    try {
      const response = await fetch(`${API_URL}/api/radarr/rootfolders`);
      if (!response.ok) throw new Error('Failed to fetch Radarr root folders');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Radarr root folders:', error);
      throw error;
    }
  },

  getMovieStatus: (radarrMovies, tmdbId) => {
    const movie = radarrMovies.find(m => m.tmdbId === tmdbId);
    if (!movie) {
      return { status: 'not_in_radarr', label: 'Not in library', monitored: false, hasFile: false };
    }
    
    if (movie.hasFile && movie.monitored) {
      return { status: 'downloaded_monitored', label: 'Téléchargé (surveillé)', monitored: true, hasFile: true };
    }
    if (movie.hasFile && !movie.monitored) {
      return { status: 'downloaded_unmonitored', label: 'Téléchargé (non surveillé)', monitored: false, hasFile: true };
    }
    if (!movie.hasFile && movie.monitored) {
      return { status: 'missing_monitored', label: 'Manquant (surveillé)', monitored: true, hasFile: false };
    }
    if (!movie.hasFile && !movie.monitored) {
      return { status: 'missing_unmonitored', label: 'Manquant (non surveillé)', monitored: false, hasFile: false };
    }
    
    return { status: 'unknown', label: 'État inconnu', monitored: movie.monitored, hasFile: movie.hasFile };
  },
};
