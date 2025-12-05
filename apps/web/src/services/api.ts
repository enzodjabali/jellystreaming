import { API_URL } from '../config';
import {
  TMDBMovie,
  TMDBTVShow,
  TMDBGenre,
  TMDBResponse,
  JellyfinMovie,
  JellyfinSeries,
  JellyfinConfig,
  JellyfinItemsResponse,
  RadarrMovie,
  RadarrAddMovie,
  RadarrQueue,
  RadarrRootFolder,
  RadarrMovieStatus,
  SonarrSeries,
  SonarrAddSeries,
  SonarrQueue,
  SonarrRootFolder,
  SonarrSeriesStatus,
} from '../types';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function for authenticated fetch
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  // If unauthorized, redirect to login
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response;
};

// TMDB API Functions
export const tmdbApi = {
  getTrending: async (type: 'movie' | 'tv' = 'movie', timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<TMDBResponse<TMDBMovie>> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/trending?type=${type}&time_window=${timeWindow}&page=${page}`
      );
      if (!response.ok) throw new Error('Failed to fetch trending');
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending:', error);
      throw error;
    }
  },

  getPopular: async (page: number = 1): Promise<TMDBResponse<TMDBMovie>> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/popular?page=${page}`
      );
      if (!response.ok) throw new Error('Failed to fetch popular movies');
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular:', error);
      throw error;
    }
  },

  getMovieDetails: async (movieId: number): Promise<TMDBMovie> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/movie?id=${movieId}`
      );
      if (!response.ok) throw new Error('Failed to fetch movie details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  },

  getGenres: async (): Promise<{ genres: TMDBGenre[] }> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/tmdb/genres`);
      if (!response.ok) throw new Error('Failed to fetch genres');
      return await response.json();
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  discoverMovies: async (params: Record<string, string> = {}): Promise<TMDBResponse<TMDBMovie>> => {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/discover?${queryParams.toString()}`
      );
      if (!response.ok) throw new Error('Failed to discover movies');
      return await response.json();
    } catch (error) {
      console.error('Error discovering movies:', error);
      throw error;
    }
  },

  searchMovies: async (query: string, page: number = 1): Promise<TMDBResponse<TMDBMovie>> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/search?query=${encodeURIComponent(query)}&page=${page}`
      );
      if (!response.ok) throw new Error('Failed to search movies');
      return await response.json();
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  getImageUrl: (path: string | null, size: string = 'w500'): string | null => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  },

  getBackdropUrl: (path: string | null, size: string = 'w1280'): string | null => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  },
};

// Jellyfin API Functions
export const jellyfinApi = {
  getMovies: async (): Promise<JellyfinMovie[]> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/jellyfin/movies`);
      if (!response.ok) throw new Error('Failed to fetch movies');
      const data: JellyfinItemsResponse<JellyfinMovie> = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error('Error fetching Jellyfin movies:', error);
      throw error;
    }
  },

  getConfig: async (): Promise<JellyfinConfig> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/config`);
      if (!response.ok) throw new Error('Failed to fetch config');
      return await response.json();
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  searchMovie: async (title: string): Promise<JellyfinMovie[]> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/jellyfin/movies/search?title=${encodeURIComponent(title)}`
      );
      if (!response.ok) throw new Error('Failed to search movie');
      const data: JellyfinItemsResponse<JellyfinMovie> = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error('Error searching movie:', error);
      throw error;
    }
  },

  getImageUrl: (movieId: string, config: JellyfinConfig | null): string | null => {
    if (!config || !movieId) return null;
    return `${config.jellyfinUrl}/Items/${movieId}/Images/Primary?api_key=${config.apiKey}`;
  },

  getBackdropUrl: (movieId: string, config: JellyfinConfig | null): string | null => {
    if (!config || !movieId) return null;
    return `${config.jellyfinUrl}/Items/${movieId}/Images/Backdrop?api_key=${config.apiKey}`;
  },
};

// Jellyfin TV Shows API Functions
export const jellyfinTVApi = {
  getSeries: async (): Promise<JellyfinSeries[]> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/jellyfin/series`);
      if (!response.ok) throw new Error('Failed to fetch TV shows');
      const data: JellyfinItemsResponse<JellyfinSeries> = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error('Error fetching Jellyfin TV shows:', error);
      throw error;
    }
  },

  getImageUrl: (seriesId: string, config: JellyfinConfig | null): string | null => {
    if (!config || !seriesId) return null;
    return `${config.jellyfinUrl}/Items/${seriesId}/Images/Primary?api_key=${config.apiKey}`;
  },

  getBackdropUrl: (seriesId: string, config: JellyfinConfig | null): string | null => {
    if (!config || !seriesId) return null;
    return `${config.jellyfinUrl}/Items/${seriesId}/Images/Backdrop?api_key=${config.apiKey}`;
  },
};

// TMDB TV Shows API Functions
export const tmdbTVApi = {
  getTrending: async (timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<TMDBResponse<TMDBTVShow>> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/tv/trending?time_window=${timeWindow}&page=${page}`
      );
      if (!response.ok) throw new Error('Failed to fetch trending TV shows');
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending TV shows:', error);
      throw error;
    }
  },

  getPopular: async (page: number = 1): Promise<TMDBResponse<TMDBTVShow>> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/tv/popular?page=${page}`
      );
      if (!response.ok) throw new Error('Failed to fetch popular TV shows');
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
      throw error;
    }
  },

  getTVDetails: async (tvId: number): Promise<TMDBTVShow> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/tv?id=${tvId}`
      );
      if (!response.ok) throw new Error('Failed to fetch TV show details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching TV show details:', error);
      throw error;
    }
  },

  searchTV: async (query: string, page: number = 1): Promise<TMDBResponse<TMDBTVShow>> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/tmdb/tv/search?query=${encodeURIComponent(query)}&page=${page}`
      );
      if (!response.ok) throw new Error('Failed to search TV shows');
      return await response.json();
    } catch (error) {
      console.error('Error searching TV shows:', error);
      throw error;
    }
  },

  getImageUrl: (path: string | null, size: string = 'w500'): string | null => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  },

  getBackdropUrl: (path: string | null, size: string = 'w1280'): string | null => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  },
};

// Radarr API Functions
export const radarrApi = {
  addMovie: async (movieData: RadarrAddMovie): Promise<RadarrMovie> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/radarr/movie`, {
        method: 'POST',
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

  getQueue: async (page: number = 1, pageSize: number = 50): Promise<RadarrQueue> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/radarr/queue?page=${page}&pageSize=${pageSize}`
      );
      if (!response.ok) throw new Error('Failed to fetch Radarr queue');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Radarr queue:', error);
      throw error;
    }
  },

  getMovies: async (): Promise<RadarrMovie[]> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/radarr/movies`);
      if (!response.ok) throw new Error('Failed to fetch Radarr movies');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Radarr movies:', error);
      throw error;
    }
  },
  
  refreshMonitoredDownloads: async (): Promise<any> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/radarr/refresh`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to refresh monitored downloads');
      return await response.json();
    } catch (error) {
      console.error('Error refreshing monitored downloads:', error);
      throw error;
    }
  },

  getRootFolders: async (): Promise<RadarrRootFolder[]> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/radarr/rootfolders`);
      if (!response.ok) throw new Error('Failed to fetch Radarr root folders');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Radarr root folders:', error);
      throw error;
    }
  },

  getMovieStatus: (radarrMovies: RadarrMovie[], tmdbId: number): RadarrMovieStatus => {
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

// Sonarr API Functions
export const sonarrApi = {
  addSeries: async (seriesData: SonarrAddSeries): Promise<SonarrSeries> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/sonarr/series`, {
        method: 'POST',
        body: JSON.stringify(seriesData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add series to Sonarr: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding series to Sonarr:', error);
      throw error;
    }
  },

  updateSeries: async (seriesData: SonarrSeries): Promise<SonarrSeries> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/sonarr/series`, {
        method: 'PUT',
        body: JSON.stringify(seriesData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update series in Sonarr: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating series in Sonarr:', error);
      throw error;
    }
  },

  getQueue: async (page: number = 1, pageSize: number = 50): Promise<SonarrQueue> => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/sonarr/queue?page=${page}&pageSize=${pageSize}`
      );
      if (!response.ok) throw new Error('Failed to fetch Sonarr queue');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Sonarr queue:', error);
      throw error;
    }
  },

  getSeries: async (): Promise<SonarrSeries[]> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/sonarr/allseries`);
      if (!response.ok) throw new Error('Failed to fetch Sonarr series');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Sonarr series:', error);
      throw error;
    }
  },
  
  refreshMonitoredDownloads: async (): Promise<any> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/sonarr/refresh`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to refresh monitored downloads');
      return await response.json();
    } catch (error) {
      console.error('Error refreshing monitored downloads:', error);
      throw error;
    }
  },

  getRootFolders: async (): Promise<SonarrRootFolder[]> => {
    try {
      const response = await authenticatedFetch(`${API_URL}/api/sonarr/rootfolders`);
      if (!response.ok) throw new Error('Failed to fetch Sonarr root folders');
      return await response.json();
    } catch (error) {
      console.error('Error fetching Sonarr root folders:', error);
      throw error;
    }
  },

  getSeriesStatus: (sonarrSeries: SonarrSeries[], tvdbId: number): SonarrSeriesStatus => {
    const series = sonarrSeries.find(s => s.tvdbId === tvdbId);
    if (!series) {
      return { status: 'not_in_sonarr', label: 'Not in library', monitored: false };
    }
    
    if (series.monitored) {
      return { status: 'monitored', label: 'Surveillé', monitored: true };
    }
    
    return { status: 'unmonitored', label: 'Non surveillé', monitored: false };
  },
};
