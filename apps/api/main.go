package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"
)

type JellyfinMovie struct {
	Name                    string            `json:"Name"`
	Id                      string            `json:"Id"`
	ServerId                string            `json:"ServerId"`
	PremiereDate            string            `json:"PremiereDate"`
	CommunityRating         float64           `json:"CommunityRating"`
	OfficialRating          string            `json:"OfficialRating"`
	RunTimeTicks            int64             `json:"RunTimeTicks"`
	ProductionYear          int               `json:"ProductionYear"`
	Container               string            `json:"Container"`
	HasSubtitles            bool              `json:"HasSubtitles"`
	PrimaryImageAspectRatio float64           `json:"PrimaryImageAspectRatio"`
	ImageTags               map[string]string `json:"ImageTags"`
	BackdropImageTags       []string          `json:"BackdropImageTags"`
	ProviderIds             map[string]string `json:"ProviderIds"`
}

type JellyfinSeries struct {
	Name                    string            `json:"Name"`
	Id                      string            `json:"Id"`
	ServerId                string            `json:"ServerId"`
	PremiereDate            string            `json:"PremiereDate"`
	CommunityRating         float64           `json:"CommunityRating"`
	OfficialRating          string            `json:"OfficialRating"`
	RunTimeTicks            int64             `json:"RunTimeTicks"`
	ProductionYear          int               `json:"ProductionYear"`
	Status                  string            `json:"Status"`
	PrimaryImageAspectRatio float64           `json:"PrimaryImageAspectRatio"`
	ImageTags               map[string]string `json:"ImageTags"`
	BackdropImageTags       []string          `json:"BackdropImageTags"`
	ProviderIds             map[string]string `json:"ProviderIds"`
	Type                    string            `json:"Type"`
	IsFolder                bool              `json:"IsFolder"`
}

type JellyfinSeriesResponse struct {
	Items            []JellyfinSeries `json:"Items"`
	TotalRecordCount int              `json:"TotalRecordCount"`
	StartIndex       int              `json:"StartIndex"`
}

type JellyfinResponse struct {
	Items            []JellyfinMovie `json:"Items"`
	TotalRecordCount int             `json:"TotalRecordCount"`
	StartIndex       int             `json:"StartIndex"`
}

type Config struct {
	JellyfinURL     string
	JellyfinUserID  string
	JellyfinAPIKey  string
	ParentID        string
	TVShowsParentID string
	Port            string
	TMDBToken       string
	RadarrURL       string
	RadarrAPIKey    string
	SonarrURL       string
	SonarrAPIKey    string
}

type RadarrAddMovieRequest struct {
	Title            string                 `json:"title"`
	QualityProfileId int                    `json:"qualityProfileId"`
	TitleSlug        string                 `json:"titleSlug"`
	Images           []map[string]string    `json:"images"`
	TmdbId           int                    `json:"tmdbId"`
	Year             int                    `json:"year"`
	RootFolderPath   string                 `json:"rootFolderPath"`
	Monitored        bool                   `json:"monitored"`
	AddOptions       map[string]interface{} `json:"addOptions"`
}

type RadarrQueueItem struct {
	MovieId                 int                      `json:"movieId"`
	Title                   string                   `json:"title"`
	Status                  string                   `json:"status"`
	TrackedDownloadStatus   string                   `json:"trackedDownloadStatus"`
	TrackedDownloadState    string                   `json:"trackedDownloadState"`
	StatusMessages          []map[string]interface{} `json:"statusMessages"`
	Size                    int64                    `json:"size"`
	Sizeleft                int64                    `json:"sizeleft"`
	Timeleft                string                   `json:"timeleft"`
	EstimatedCompletionTime string                   `json:"estimatedCompletionTime"`
	Protocol                string                   `json:"protocol"`
	DownloadClient          string                   `json:"downloadClient"`
	Id                      int                      `json:"id"`
}

type RadarrQueueResponse struct {
	Page         int               `json:"page"`
	PageSize     int               `json:"pageSize"`
	TotalRecords int               `json:"totalRecords"`
	Records      []RadarrQueueItem `json:"records"`
}

type RadarrMovie struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	TmdbId      int    `json:"tmdbId"`
	Monitored   bool   `json:"monitored"`
	HasFile     bool   `json:"hasFile"`
	IsAvailable bool   `json:"isAvailable"`
	Status      string `json:"status,omitempty"`
}

type SonarrSeason struct {
	SeasonNumber int                    `json:"seasonNumber"`
	Monitored    bool                   `json:"monitored"`
	Statistics   map[string]interface{} `json:"statistics,omitempty"`
}

type SonarrSeries struct {
	Id        int                 `json:"id"`
	Title     string              `json:"title"`
	TvdbId    int                 `json:"tvdbId"`
	TmdbId    int                 `json:"tmdbId,omitempty"`
	Monitored bool                `json:"monitored"`
	Status    string              `json:"status"`
	Seasons   []SonarrSeason      `json:"seasons"`
	Year      int                 `json:"year,omitempty"`
	Images    []map[string]string `json:"images,omitempty"`
	TitleSlug string              `json:"titleSlug,omitempty"`
}

type SonarrAddSeriesRequest struct {
	Title            string                 `json:"title"`
	QualityProfileId int                    `json:"qualityProfileId"`
	TitleSlug        string                 `json:"titleSlug"`
	Images           []map[string]string    `json:"images"`
	TvdbId           int                    `json:"tvdbId"`
	Year             int                    `json:"year"`
	RootFolderPath   string                 `json:"rootFolderPath"`
	Monitored        bool                   `json:"monitored"`
	SeasonFolder     bool                   `json:"seasonFolder"`
	Seasons          []SonarrSeason         `json:"seasons"`
	AddOptions       map[string]interface{} `json:"addOptions"`
}

type SonarrQueueItem struct {
	SeriesId                int                      `json:"seriesId"`
	EpisodeId               int                      `json:"episodeId"`
	Title                   string                   `json:"title"`
	Status                  string                   `json:"status"`
	TrackedDownloadStatus   string                   `json:"trackedDownloadStatus"`
	TrackedDownloadState    string                   `json:"trackedDownloadState"`
	StatusMessages          []map[string]interface{} `json:"statusMessages"`
	Size                    int64                    `json:"size"`
	Sizeleft                int64                    `json:"sizeleft"`
	Timeleft                string                   `json:"timeleft"`
	EstimatedCompletionTime string                   `json:"estimatedCompletionTime"`
	Protocol                string                   `json:"protocol"`
	DownloadClient          string                   `json:"downloadClient"`
	Id                      int                      `json:"id"`
	Episode                 map[string]interface{}   `json:"episode,omitempty"`
	Series                  *SonarrSeries            `json:"series,omitempty"`
}

type SonarrQueueResponse struct {
	Page         int               `json:"page"`
	PageSize     int               `json:"pageSize"`
	TotalRecords int               `json:"totalRecords"`
	Records      []SonarrQueueItem `json:"records"`
}

var config Config

func init() {
	config = Config{
		JellyfinURL:     getEnv("JELLYFIN_URL", "https://watch.jellystreaming.ovh"),
		JellyfinUserID:  getEnv("JELLYFIN_USER_ID", "700d4b2ee01941da951a1d2c716476cd"),
		JellyfinAPIKey:  getEnv("JELLYFIN_API_KEY", ""),
		ParentID:        getEnv("JELLYFIN_PARENT_ID", "db4c1708cbb5dd1676284a40f2950aba"),
		TVShowsParentID: getEnv("JELLYFIN_TVSHOWS_PARENT_ID", "d565273fd114d77bdf349a2896867069"),
		Port:            getEnv("PORT", "8080"),
		TMDBToken:       getEnv("TMDB_TOKEN", ""),
		RadarrURL:       getEnv("RADARR_URL", "https://radarr.jellystreaming.ovh"),
		RadarrAPIKey:    getEnv("RADARR_API_KEY", ""),
		SonarrURL:       getEnv("SONARR_URL", "https://sonarr.jellystreaming.ovh"),
		SonarrAPIKey:    getEnv("SONARR_API_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// CORS middleware
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func fetchJellyfinMovies(limit int, startIndex int) (*JellyfinResponse, error) {
	url := fmt.Sprintf(
		"%s/Users/%s/Items?SortBy=DateCreated,SortName,ProductionYear&SortOrder=Descending&IncludeItemTypes=Movie&Recursive=true&Fields=PrimaryImageAspectRatio,MediaSourceCount&ImageTypeLimit=1&EnableImageTypes=Primary,Backdrop,Banner,Thumb&StartIndex=%d&ParentId=%s&Limit=%d",
		config.JellyfinURL,
		config.JellyfinUserID,
		startIndex,
		config.ParentID,
		limit,
	)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Add authentication header if API key is set
	if config.JellyfinAPIKey != "" {
		req.Header.Set("X-Emby-Token", config.JellyfinAPIKey)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("jellyfin API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	var jellyfinResp JellyfinResponse
	if err := json.Unmarshal(body, &jellyfinResp); err != nil {
		return nil, fmt.Errorf("error parsing response: %v", err)
	}

	return &jellyfinResp, nil
}

func moviesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get query parameters for pagination
	limit := 100
	startIndex := 0

	movies, err := fetchJellyfinMovies(limit, startIndex)
	if err != nil {
		log.Printf("Error fetching movies: %v", err)
		http.Error(w, fmt.Sprintf("Error fetching movies: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(movies)
}

func configHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"jellyfinUrl": config.JellyfinURL,
		"userId":      config.JellyfinUserID,
		"apiKey":      config.JellyfinAPIKey,
	})
}

func searchMovieHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get search query from URL params
	title := r.URL.Query().Get("title")
	if title == "" {
		http.Error(w, "Missing title parameter", http.StatusBadRequest)
		return
	}

	// Log the search query
	log.Printf("Searching Jellyfin for: %s", title)

	// Search in Jellyfin - Build URL with proper query parameters
	baseURL := fmt.Sprintf(
		"%s/Users/%s/Items",
		config.JellyfinURL,
		config.JellyfinUserID,
	)

	// Create URL with properly encoded query parameters
	jellyfinURL, err := url.Parse(baseURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error parsing URL: %v", err), http.StatusInternalServerError)
		return
	}

	// Add query parameters
	query := jellyfinURL.Query()
	query.Set("SearchTerm", title)
	query.Set("IncludeItemTypes", "Movie")
	query.Set("Recursive", "true")
	query.Set("Fields", "PrimaryImageAspectRatio,ProductionYear,ProviderIds")
	query.Set("ImageTypeLimit", "1")
	query.Set("EnableImageTypes", "Primary,Backdrop")
	query.Set("ParentId", config.ParentID)
	query.Set("Limit", "20")
	jellyfinURL.RawQuery = query.Encode()

	urlStr := jellyfinURL.String()
	log.Printf("Jellyfin URL: %s", urlStr)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	// Add authentication header if API key is set
	if config.JellyfinAPIKey != "" {
		req.Header.Set("X-Emby-Token", config.JellyfinAPIKey)
	}

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error making request: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		http.Error(w, fmt.Sprintf("Jellyfin API returned status %d: %s", resp.StatusCode, string(body)), http.StatusInternalServerError)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error reading response: %v", err), http.StatusInternalServerError)
		return
	}

	var jellyfinResp JellyfinResponse
	if err := json.Unmarshal(body, &jellyfinResp); err != nil {
		http.Error(w, fmt.Sprintf("Error parsing response: %v", err), http.StatusInternalServerError)
		return
	}

	// Log the results
	log.Printf("Found %d movies for search '%s'", jellyfinResp.TotalRecordCount, title)
	for _, movie := range jellyfinResp.Items {
		log.Printf("  - %s (%d)", movie.Name, movie.ProductionYear)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jellyfinResp)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	})
}

// TMDB API Proxy Handlers
func tmdbProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get the TMDB endpoint from query params
	endpoint := r.URL.Query().Get("endpoint")
	if endpoint == "" {
		http.Error(w, "Missing endpoint parameter", http.StatusBadRequest)
		return
	}

	// Build TMDB API URL
	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3%s", endpoint)

	// Parse query parameters from original request
	queryParams := r.URL.Query()
	queryParams.Del("endpoint") // Remove our custom param

	if len(queryParams) > 0 {
		tmdbURL += "?" + queryParams.Encode()
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Create request
	req, err := http.NewRequest("GET", tmdbURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	// Add TMDB authorization header
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	// Make request
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error making request: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error reading response: %v", err), http.StatusInternalServerError)
		return
	}

	// Forward status code and response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// Specific TMDB endpoints for convenience
func tmdbTrendingHandler(w http.ResponseWriter, r *http.Request) {
	mediaType := r.URL.Query().Get("type")
	if mediaType == "" {
		mediaType = "movie"
	}
	timeWindow := r.URL.Query().Get("time_window")
	if timeWindow == "" {
		timeWindow = "week"
	}
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	endpoint := fmt.Sprintf("/trending/%s/%s", mediaType, timeWindow)
	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3%s?language=en-US&page=%s", endpoint, page)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbPopularHandler(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/movie/popular?language=en-US&page=%s", page)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbMovieDetailsHandler(w http.ResponseWriter, r *http.Request) {
	movieID := r.URL.Query().Get("id")
	if movieID == "" {
		http.Error(w, "Missing movie ID", http.StatusBadRequest)
		return
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/movie/%s?language=en-US&append_to_response=credits,videos,similar", movieID)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbGenresHandler(w http.ResponseWriter, r *http.Request) {
	tmdbURL := "https://api.themoviedb.org/3/genre/movie/list?language=en-US"

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbDiscoverHandler(w http.ResponseWriter, r *http.Request) {
	// Get query parameters
	queryParams := r.URL.Query()
	queryParams.Set("language", "en-US")

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/discover/movie?%s", queryParams.Encode())

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbSearchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Missing search query", http.StatusBadRequest)
		return
	}

	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/search/movie?query=%s&language=en-US&page=%s", query, page)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// Radarr Handlers
func radarrAddMovieHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RadarrAddMovieRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set default values if not provided
	if req.QualityProfileId == 0 {
		req.QualityProfileId = 1
	}
	if req.RootFolderPath == "" {
		req.RootFolderPath = "/movies"
	}
	if req.AddOptions == nil {
		req.AddOptions = map[string]interface{}{
			"searchForMovie": true,
		}
	}
	req.Monitored = true

	jsonData, err := json.Marshal(req)
	if err != nil {
		http.Error(w, "Error encoding request", http.StatusInternalServerError)
		return
	}

	radarrURL := fmt.Sprintf("%s/api/v3/movie", config.RadarrURL)
	client := &http.Client{Timeout: 30 * time.Second}

	httpReq, err := http.NewRequest("POST", radarrURL, io.NopCloser(bytes.NewReader(jsonData)))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	httpReq.Header.Set("X-Api-Key", config.RadarrAPIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Radarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	log.Printf("Radarr add movie response status: %d", resp.StatusCode)
	log.Printf("Radarr response body: %s", string(body))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func radarrQueueHandler(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}
	pageSize := r.URL.Query().Get("pageSize")
	if pageSize == "" {
		pageSize = "50"
	}

	radarrURL := fmt.Sprintf("%s/api/v3/queue?page=%s&pageSize=%s&sortDirection=ascending&sortKey=timeleft&includeUnknownMovieItems=true",
		config.RadarrURL, page, pageSize)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", radarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.RadarrAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Radarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func radarrMoviesHandler(w http.ResponseWriter, r *http.Request) {
	radarrURL := fmt.Sprintf("%s/api/v3/movie", config.RadarrURL)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", radarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.RadarrAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Radarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func radarrRootFoldersHandler(w http.ResponseWriter, r *http.Request) {
	radarrURL := fmt.Sprintf("%s/api/v3/rootfolder", config.RadarrURL)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", radarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.RadarrAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Radarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func radarrRefreshHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Trigger RefreshMonitoredDownloads command in Radarr
	radarrURL := fmt.Sprintf("%s/api/v3/command", config.RadarrURL)

	commandBody := map[string]interface{}{
		"name": "RefreshMonitoredDownloads",
	}

	jsonBody, err := json.Marshal(commandBody)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("POST", radarrURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.RadarrAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Radarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// Jellyfin TV Shows Handler
func fetchJellyfinSeries(limit int, startIndex int) (*JellyfinSeriesResponse, error) {
	url := fmt.Sprintf(
		"%s/Users/%s/Items?SortBy=DateCreated,SortName&SortOrder=Descending&IncludeItemTypes=Series&Recursive=true&Fields=PrimaryImageAspectRatio&ImageTypeLimit=1&EnableImageTypes=Primary,Backdrop,Banner,Thumb&StartIndex=%d&ParentId=%s&Limit=%d",
		config.JellyfinURL,
		config.JellyfinUserID,
		startIndex,
		config.TVShowsParentID,
		limit,
	)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	if config.JellyfinAPIKey != "" {
		req.Header.Set("X-Emby-Token", config.JellyfinAPIKey)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("jellyfin API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	var jellyfinResp JellyfinSeriesResponse
	if err := json.Unmarshal(body, &jellyfinResp); err != nil {
		return nil, fmt.Errorf("error parsing response: %v", err)
	}

	return &jellyfinResp, nil
}

func seriesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	limit := 100
	startIndex := 0

	series, err := fetchJellyfinSeries(limit, startIndex)
	if err != nil {
		log.Printf("Error fetching series: %v", err)
		http.Error(w, fmt.Sprintf("Error fetching series: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(series)
}

// Sonarr Handlers
func sonarrAddSeriesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SonarrAddSeriesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.QualityProfileId == 0 {
		req.QualityProfileId = 1
	}
	if req.RootFolderPath == "" {
		req.RootFolderPath = "/tv"
	}
	if req.AddOptions == nil {
		req.AddOptions = map[string]interface{}{
			"searchForMissingEpisodes": true,
		}
	}
	req.Monitored = true
	req.SeasonFolder = true

	jsonData, err := json.Marshal(req)
	if err != nil {
		http.Error(w, "Error encoding request", http.StatusInternalServerError)
		return
	}

	sonarrURL := fmt.Sprintf("%s/api/v3/series", config.SonarrURL)
	client := &http.Client{Timeout: 30 * time.Second}

	httpReq, err := http.NewRequest("POST", sonarrURL, bytes.NewBuffer(jsonData))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	httpReq.Header.Set("X-Api-Key", config.SonarrAPIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Sonarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	log.Printf("Sonarr add series response status: %d", resp.StatusCode)
	log.Printf("Sonarr response body: %s", string(body))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func sonarrQueueHandler(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}
	pageSize := r.URL.Query().Get("pageSize")
	if pageSize == "" {
		pageSize = "50"
	}

	sonarrURL := fmt.Sprintf("%s/api/v3/queue?page=%s&pageSize=%s&sortDirection=ascending&sortKey=timeleft&includeUnknownSeriesItems=true&includeSeries=true&includeEpisode=true",
		config.SonarrURL, page, pageSize)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", sonarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.SonarrAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Sonarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func sonarrSeriesHandler(w http.ResponseWriter, r *http.Request) {
	sonarrURL := fmt.Sprintf("%s/api/v3/series", config.SonarrURL)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", sonarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.SonarrAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Sonarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func sonarrRootFoldersHandler(w http.ResponseWriter, r *http.Request) {
	sonarrURL := fmt.Sprintf("%s/api/v3/rootfolder", config.SonarrURL)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", sonarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.SonarrAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Sonarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func sonarrLookupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	term := r.URL.Query().Get("term")
	if term == "" {
		http.Error(w, "Missing term parameter", http.StatusBadRequest)
		return
	}

	// URL encode the term for the Sonarr API
	encodedTerm := url.QueryEscape(term)
	sonarrURL := fmt.Sprintf("%s/api/v3/series/lookup?term=%s", config.SonarrURL, encodedTerm)

	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest("GET", sonarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.SonarrAPIKey)

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Sonarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func sonarrRefreshHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sonarrURL := fmt.Sprintf("%s/api/v3/command", config.SonarrURL)

	commandBody := map[string]interface{}{
		"name": "RefreshMonitoredDownloads",
	}

	jsonBody, err := json.Marshal(commandBody)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("POST", sonarrURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", config.SonarrAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error calling Sonarr: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// TMDB TV Shows Handlers
func tmdbTVTrendingHandler(w http.ResponseWriter, r *http.Request) {
	timeWindow := r.URL.Query().Get("time_window")
	if timeWindow == "" {
		timeWindow = "week"
	}
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/trending/tv/%s?language=en-US&page=%s", timeWindow, page)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbTVPopularHandler(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/tv/popular?language=en-US&page=%s", page)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbTVDetailsHandler(w http.ResponseWriter, r *http.Request) {
	tvID := r.URL.Query().Get("id")
	if tvID == "" {
		http.Error(w, "Missing TV show ID", http.StatusBadRequest)
		return
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/tv/%s?language=en-US&append_to_response=credits,videos,similar,seasons", tvID)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbTVExternalIDsHandler(w http.ResponseWriter, r *http.Request) {
	// Extract TV ID from URL path /api/tmdb/tv/{id}/external_ids
	path := r.URL.Path
	var tvID string
	fmt.Sscanf(path, "/api/tmdb/tv/%s/external_ids", &tvID)

	if tvID == "" {
		http.Error(w, "Missing TV show ID", http.StatusBadRequest)
		return
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/tv/%s/external_ids", tvID)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func tmdbTVSearchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Missing search query", http.StatusBadRequest)
		return
	}

	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/search/tv?query=%s&language=en-US&page=%s", query, page)

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", tmdbURL, nil)
	req.Header.Set("Authorization", "Bearer "+config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

func main() {
	// Setup routes with CORS
	http.HandleFunc("/api/jellyfin/movies", enableCORS(moviesHandler))
	http.HandleFunc("/api/config", enableCORS(configHandler))
	http.HandleFunc("/api/jellyfin/movies/search", enableCORS(searchMovieHandler))
	http.HandleFunc("/health", enableCORS(healthHandler))

	// TMDB proxy routes
	http.HandleFunc("/api/tmdb/proxy", enableCORS(tmdbProxyHandler))
	http.HandleFunc("/api/tmdb/trending", enableCORS(tmdbTrendingHandler))
	http.HandleFunc("/api/tmdb/popular", enableCORS(tmdbPopularHandler))
	http.HandleFunc("/api/tmdb/movie", enableCORS(tmdbMovieDetailsHandler))
	http.HandleFunc("/api/tmdb/genres", enableCORS(tmdbGenresHandler))
	http.HandleFunc("/api/tmdb/discover", enableCORS(tmdbDiscoverHandler))
	http.HandleFunc("/api/tmdb/search", enableCORS(tmdbSearchHandler))

	// Radarr routes
	http.HandleFunc("/api/radarr/movie", enableCORS(radarrAddMovieHandler))
	http.HandleFunc("/api/radarr/queue", enableCORS(radarrQueueHandler))
	http.HandleFunc("/api/radarr/movies", enableCORS(radarrMoviesHandler))
	http.HandleFunc("/api/radarr/rootfolders", enableCORS(radarrRootFoldersHandler))
	http.HandleFunc("/api/radarr/refresh", enableCORS(radarrRefreshHandler))

	// Jellyfin TV Shows routes
	http.HandleFunc("/api/jellyfin/series", enableCORS(seriesHandler))

	// Sonarr routes
	http.HandleFunc("/api/sonarr/series", enableCORS(sonarrAddSeriesHandler))
	http.HandleFunc("/api/sonarr/queue", enableCORS(sonarrQueueHandler))
	http.HandleFunc("/api/sonarr/allseries", enableCORS(sonarrSeriesHandler))
	http.HandleFunc("/api/sonarr/rootfolders", enableCORS(sonarrRootFoldersHandler))
	http.HandleFunc("/api/sonarr/refresh", enableCORS(sonarrRefreshHandler))
	http.HandleFunc("/api/sonarr/lookup", enableCORS(sonarrLookupHandler))

	// TMDB TV Shows routes (order matters - most specific first)
	http.HandleFunc("/api/tmdb/tv/trending", enableCORS(tmdbTVTrendingHandler))
	http.HandleFunc("/api/tmdb/tv/popular", enableCORS(tmdbTVPopularHandler))
	http.HandleFunc("/api/tmdb/tv/search", enableCORS(tmdbTVSearchHandler))

	// TV details and external IDs router
	http.HandleFunc("/api/tmdb/tv/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		// Handle /api/tmdb/tv/{id}/external_ids
		if len(path) > len("/api/tmdb/tv/") && len(path) >= 13 {
			if path[len(path)-13:] == "/external_ids" {
				tmdbTVExternalIDsHandler(w, r)
				return
			}
		}
		tmdbTVDetailsHandler(w, r)
	}))

	// Also handle /api/tmdb/tv without trailing slash
	http.HandleFunc("/api/tmdb/tv", enableCORS(tmdbTVDetailsHandler))

	// Root handler
	http.HandleFunc("/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "JellyStreaming API",
			"version": "2.1.0",
			"endpoints": map[string]string{
				"/api/jellyfin/movies":        "GET - Fetch movies from Jellyfin",
				"/api/jellyfin/movies/search": "GET - Search movie in Jellyfin (requires ?title=)",
				"/api/jellyfin/series":        "GET - Fetch TV shows from Jellyfin",
				"/api/config":                 "GET - Get Jellyfin configuration",
				"/health":                     "GET - Health check",
				"/api/tmdb/trending":          "GET - Get trending movies from TMDB",
				"/api/tmdb/popular":           "GET - Get popular movies from TMDB",
				"/api/tmdb/movie":             "GET - Get movie details from TMDB (requires ?id=)",
				"/api/tmdb/genres":            "GET - Get movie genres from TMDB",
				"/api/tmdb/discover":          "GET - Discover movies from TMDB",
				"/api/tmdb/search":            "GET - Search movies from TMDB (requires ?query=)",
				"/api/tmdb/tv/trending":       "GET - Get trending TV shows from TMDB",
				"/api/tmdb/tv/popular":        "GET - Get popular TV shows from TMDB",
				"/api/tmdb/tv":                "GET - Get TV show details from TMDB (requires ?id=)",
				"/api/tmdb/tv/search":         "GET - Search TV shows from TMDB (requires ?query=)",
				"/api/radarr/movie":           "POST - Add movie to Radarr",
				"/api/radarr/queue":           "GET - Get Radarr download queue",
				"/api/radarr/movies":          "GET - Get all movies in Radarr",
				"/api/radarr/rootfolders":     "GET - Get Radarr root folders",
				"/api/radarr/refresh":         "POST - Refresh Radarr monitored downloads",
				"/api/sonarr/series":          "POST - Add TV show to Sonarr",
				"/api/sonarr/queue":           "GET - Get Sonarr download queue",
				"/api/sonarr/allseries":       "GET - Get all TV shows in Sonarr",
				"/api/sonarr/rootfolders":     "GET - Get Sonarr root folders",
				"/api/sonarr/refresh":         "POST - Refresh Sonarr monitored downloads",
			},
		})
	}))

	port := config.Port
	log.Printf("Starting JellyStreaming API on port %s", port)
	log.Printf("Jellyfin URL: %s", config.JellyfinURL)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
