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
	PremiereDate            string            `json:"PremiereDate"`
	CommunityRating         float64           `json:"CommunityRating"`
	OfficialRating          string            `json:"OfficialRating"`
	RunTimeTicks            int64             `json:"RunTimeTicks"`
	ProductionYear          int               `json:"ProductionYear"`
	Container               string            `json:"Container"`
	HasSubtitles            bool              `json:"HasSubtitles"`
	PrimaryImageAspectRatio float64           `json:"PrimaryImageAspectRatio"`
	ImageTags               map[string]string `json:"ImageTags"`
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
}

var config Config

func init() {
	config = Config{
		JellyfinURL:    getEnv("JELLYFIN_URL", "https://watch.jellystreaming.ovh"),
		JellyfinUserID: getEnv("JELLYFIN_USER_ID", "700d4b2ee01941da951a1d2c716476cd"),
		JellyfinAPIKey: getEnv("JELLYFIN_API_KEY", ""),
		ParentID:       getEnv("JELLYFIN_PARENT_ID", "db4c1708cbb5dd1676284a40f2950aba"),
		Port:           getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getJellyfinAPIKey() (string, error) {
	// This function is a placeholder for future authentication implementation
	// For now, the API works without authentication for public instances
	// In production, you should implement proper Jellyfin authentication
	return "", nil
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

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	})
}

func main() {
	// Setup routes
	http.HandleFunc("/api/movies", moviesHandler)
	http.HandleFunc("/health", healthHandler)

	// Root handler
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "JellyStreaming API",
			"version": "1.0.0",
			"endpoints": map[string]string{
				"/api/movies": "GET - Fetch movies from Jellyfin",
				"/health":     "GET - Health check",
			},
		})
	})

	port := config.Port
	log.Printf("Starting JellyStreaming API on port %s", port)
	log.Printf("Jellyfin URL: %s", config.JellyfinURL)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
