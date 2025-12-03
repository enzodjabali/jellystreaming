package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
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
}

type JellyfinResponse struct {
	Items            []JellyfinMovie `json:"Items"`
	TotalRecordCount int             `json:"TotalRecordCount"`
	StartIndex       int             `json:"StartIndex"`
}

type Config struct {
	JellyfinURL    string
	JellyfinUserID string
	JellyfinAPIKey string
	ParentID       string
	Port           string
	TMDBToken      string
}

var config Config

func init() {
	config = Config{
		JellyfinURL:    getEnv("JELLYFIN_URL", "https://watch.jellystreaming.ovh"),
		JellyfinUserID: getEnv("JELLYFIN_USER_ID", "700d4b2ee01941da951a1d2c716476cd"),
		JellyfinAPIKey: getEnv("JELLYFIN_API_KEY", ""),
		ParentID:       getEnv("JELLYFIN_PARENT_ID", "db4c1708cbb5dd1676284a40f2950aba"),
		Port:           getEnv("PORT", "8080"),
		TMDBToken:      getEnv("TMDB_TOKEN", ""),
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

	endpoint := fmt.Sprintf("/trending/%s/%s", mediaType, timeWindow)
	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3%s?language=en-US", endpoint)

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

func main() {
	// Setup routes with CORS
	http.HandleFunc("/api/movies", enableCORS(moviesHandler))
	http.HandleFunc("/api/config", enableCORS(configHandler))
	http.HandleFunc("/health", enableCORS(healthHandler))

	// TMDB proxy routes
	http.HandleFunc("/api/tmdb/proxy", enableCORS(tmdbProxyHandler))
	http.HandleFunc("/api/tmdb/trending", enableCORS(tmdbTrendingHandler))
	http.HandleFunc("/api/tmdb/popular", enableCORS(tmdbPopularHandler))
	http.HandleFunc("/api/tmdb/movie", enableCORS(tmdbMovieDetailsHandler))
	http.HandleFunc("/api/tmdb/genres", enableCORS(tmdbGenresHandler))
	http.HandleFunc("/api/tmdb/discover", enableCORS(tmdbDiscoverHandler))
	http.HandleFunc("/api/tmdb/search", enableCORS(tmdbSearchHandler))

	// Root handler
	http.HandleFunc("/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "JellyStreaming API",
			"version": "2.0.0",
			"endpoints": map[string]string{
				"/api/movies":        "GET - Fetch movies from Jellyfin",
				"/api/config":        "GET - Get Jellyfin configuration",
				"/health":            "GET - Health check",
				"/api/tmdb/trending": "GET - Get trending movies from TMDB",
				"/api/tmdb/popular":  "GET - Get popular movies from TMDB",
				"/api/tmdb/movie":    "GET - Get movie details from TMDB (requires ?id=)",
				"/api/tmdb/genres":   "GET - Get movie genres from TMDB",
				"/api/tmdb/discover": "GET - Discover movies from TMDB",
				"/api/tmdb/search":   "GET - Search movies from TMDB (requires ?query=)",
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
