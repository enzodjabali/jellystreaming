// Global type definitions for the application

// Window interface extension for runtime config
declare global {
  interface Window {
    APP_CONFIG?: {
      API_URL?: string;
    };
  }
}

// User types
export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

// Auth types
export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

// TMDB types
export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  genres?: TMDBGenre[];
  runtime?: number;
  status?: string;
  tagline?: string;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  original_title?: string;
  adult?: boolean;
  video?: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  genres?: TMDBGenre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  original_name?: string;
  tvdb_id?: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Jellyfin types
export interface JellyfinMovie {
  Id: string;
  Name: string;
  Overview: string;
  ProductionYear?: number;
  CommunityRating?: number;
  OfficialRating?: string;
  RunTimeTicks?: number;
  Genres?: string[];
  ImageTags?: {
    Primary?: string;
    Backdrop?: string;
  };
  BackdropImageTags?: string[];
  Type: string;
  UserData?: {
    PlaybackPositionTicks?: number;
    PlayedPercentage?: number;
    Played?: boolean;
  };
  ProviderIds?: {
    Tmdb?: string;
    Imdb?: string;
    Tvdb?: string;
  };
}

export interface JellyfinSeries {
  Id: string;
  Name: string;
  Overview: string;
  ProductionYear?: number;
  CommunityRating?: number;
  OfficialRating?: string;
  Genres?: string[];
  ImageTags?: {
    Primary?: string;
    Backdrop?: string;
  };
  BackdropImageTags?: string[];
  Type: string;
  ProviderIds?: {
    Tmdb?: string;
    Imdb?: string;
    Tvdb?: string;
  };
  PremiereDate?: string;
}

export interface JellyfinConfig {
  jellyfinUrl: string;
  apiKey: string;
}

export interface JellyfinItemsResponse<T> {
  Items: T[];
  TotalRecordCount: number;
}

// Radarr types
export interface RadarrMovie {
  id: number;
  tmdbId: number;
  title: string;
  year: number;
  hasFile: boolean;
  monitored: boolean;
  isAvailable?: boolean;
  overview?: string;
  images?: RadarrImage[];
  qualityProfileId?: number;
  status?: string;
  path?: string;
}

export interface RadarrImage {
  coverType: string;
  url: string;
  remoteUrl?: string;
}

export interface RadarrAddMovie {
  title: string;
  tmdbId: number;
  qualityProfileId: number;
  rootFolderPath: string;
  monitored: boolean;
  addOptions?: {
    searchForMovie?: boolean;
  };
}

export interface RadarrQueueItem {
  id: number;
  movieId: number;
  title: string;
  status: string;
  trackedDownloadStatus?: string;
  trackedDownloadState?: string;
  statusMessages?: Array<{ title: string; messages: string[] }>;
  errorMessage?: string;
  downloadId?: string;
  protocol?: string;
  downloadClient?: string;
  indexer?: string;
  outputPath?: string;
  sizeleft?: number;
  size?: number;
  timeleft?: string;
  estimatedCompletionTime?: string;
}

export interface RadarrQueue {
  page: number;
  pageSize: number;
  totalRecords: number;
  records: RadarrQueueItem[];
}

export interface RadarrRootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace: number;
  unmappedFolders?: Array<{ name: string; path: string }>;
}

export interface RadarrMovieStatus {
  status: string;
  label: string;
  monitored: boolean;
  hasFile: boolean;
}

// Sonarr types
export interface SonarrSeries {
  id: number;
  tvdbId: number;
  title: string;
  year: number;
  monitored: boolean;
  seasonFolder?: boolean;
  overview?: string;
  images?: SonarrImage[];
  qualityProfileId?: number;
  status?: string;
  path?: string;
  seasons?: SonarrSeason[];
}

export interface SonarrImage {
  coverType: string;
  url: string;
  remoteUrl?: string;
}

export interface SonarrSeason {
  seasonNumber: number;
  monitored: boolean;
}

export interface SonarrAddSeries {
  title: string;
  tvdbId: number;
  qualityProfileId: number;
  rootFolderPath: string;
  monitored: boolean;
  seasonFolder?: boolean;
  seasons?: SonarrSeason[];
  addOptions?: {
    searchForMissingEpisodes?: boolean;
  };
}

export interface SonarrQueueItem {
  id: number;
  seriesId: number;
  episodeId: number;
  title: string;
  status: string;
  trackedDownloadStatus?: string;
  trackedDownloadState?: string;
  statusMessages?: Array<{ title: string; messages: string[] }>;
  errorMessage?: string;
  downloadId?: string;
  protocol?: string;
  downloadClient?: string;
  indexer?: string;
  outputPath?: string;
  sizeleft?: number;
  size?: number;
  timeleft?: string;
  estimatedCompletionTime?: string;
}

export interface SonarrQueue {
  page: number;
  pageSize: number;
  totalRecords: number;
  records: SonarrQueueItem[];
}

export interface SonarrRootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace: number;
  unmappedFolders?: Array<{ name: string; path: string }>;
}

export interface SonarrSeriesStatus {
  status: string;
  label: string;
  monitored: boolean;
}

// API Request types
export interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export {};
