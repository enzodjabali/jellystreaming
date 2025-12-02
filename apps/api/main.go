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
	JellyfinURL      string
	JellyfinUserID   string
	JellyfinAPIKey   string
	ParentID         string
	JellyseerrURL    string
	JellyseerrAPIKey string
	Port             string
}

var config Config

func init() {
	config = Config{
		JellyfinURL:      getEnv("JELLYFIN_URL", "https://watch.jellystreaming.ovh"),
		JellyfinUserID:   getEnv("JELLYFIN_USER_ID", ""),
		JellyfinAPIKey:   getEnv("JELLYFIN_API_KEY", ""),
		ParentID:         getEnv("JELLYFIN_PARENT_ID", ""),
		JellyseerrURL:    getEnv("JELLYSEERR_URL", ""),
		JellyseerrAPIKey: getEnv("JELLYSEERR_API_KEY", ""),
		Port:             getEnv("PORT", "8080"),
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

// Jellyseerr proxy handlers
func fetchFromJellyseerr(endpoint string) ([]byte, error) {
	url := fmt.Sprintf("%s/%s", config.JellyseerrURL, endpoint)

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Add Jellyseerr API key
	req.Header.Set("X-Api-Key", config.JellyseerrAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("jellyseerr API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	return body, nil
}

func trendingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get page from query parameter, default to 1
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	endpoint := fmt.Sprintf("discover/trending?page=%s", page)
	body, err := fetchFromJellyseerr(endpoint)
	if err != nil {
		log.Printf("Error fetching trending from Jellyseerr: %v", err)
		http.Error(w, fmt.Sprintf("Error fetching trending: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func popularMoviesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get page from query parameter, default to 1
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	endpoint := fmt.Sprintf("discover/movies?page=%s", page)
	body, err := fetchFromJellyseerr(endpoint)
	if err != nil {
		log.Printf("Error fetching popular movies from Jellyseerr: %v", err)
		http.Error(w, fmt.Sprintf("Error fetching popular movies: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func requestStatsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	endpoint := "request/count"
	body, err := fetchFromJellyseerr(endpoint)
	if err != nil {
		log.Printf("Error fetching request stats from Jellyseerr: %v", err)
		http.Error(w, fmt.Sprintf("Error fetching request stats: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func main() {
	// Setup routes with CORS
	http.HandleFunc("/api/movies", enableCORS(moviesHandler))
	http.HandleFunc("/api/config", enableCORS(configHandler))
	http.HandleFunc("/api/jellyseerr/trending", enableCORS(trendingHandler))
	http.HandleFunc("/api/jellyseerr/popular", enableCORS(popularMoviesHandler))
	http.HandleFunc("/api/jellyseerr/stats", enableCORS(requestStatsHandler))
	http.HandleFunc("/health", enableCORS(healthHandler))

	// Root handler
	http.HandleFunc("/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "JellyStreaming API",
			"version": "2.0.0",
			"endpoints": map[string]string{
				"/api/movies":              "GET - Fetch movies from Jellyfin",
				"/api/config":              "GET - Get Jellyfin configuration",
				"/api/jellyseerr/trending": "GET - Fetch trending from Jellyseerr (page query param)",
				"/api/jellyseerr/popular":  "GET - Fetch popular movies from Jellyseerr (page query param)",
				"/api/jellyseerr/stats":    "GET - Fetch request statistics from Jellyseerr",
				"/health":                  "GET - Health check",
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
