package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"jellystreaming/internal/config"
	"jellystreaming/internal/models"
)

// JellyfinHandler handles Jellyfin-related requests
type JellyfinHandler struct {
	config *config.Config
}

// NewJellyfinHandler creates a new JellyfinHandler
func NewJellyfinHandler(cfg *config.Config) *JellyfinHandler {
	return &JellyfinHandler{config: cfg}
}

// fetchMovies fetches movies from Jellyfin
func (h *JellyfinHandler) fetchMovies(limit int, startIndex int) (*models.JellyfinResponse, error) {
	url := fmt.Sprintf(
		"%s/Users/%s/Items?SortBy=DateCreated,SortName,ProductionYear&SortOrder=Descending&IncludeItemTypes=Movie&Recursive=true&Fields=PrimaryImageAspectRatio,MediaSourceCount&ImageTypeLimit=1&EnableImageTypes=Primary,Backdrop,Banner,Thumb&StartIndex=%d&ParentId=%s&Limit=%d",
		h.config.JellyfinURL,
		h.config.JellyfinUserID,
		startIndex,
		h.config.ParentID,
		limit,
	)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	if h.config.JellyfinAPIKey != "" {
		req.Header.Set("X-Emby-Token", h.config.JellyfinAPIKey)
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

	var jellyfinResp models.JellyfinResponse
	if err := json.Unmarshal(body, &jellyfinResp); err != nil {
		return nil, fmt.Errorf("error parsing response: %v", err)
	}

	return &jellyfinResp, nil
}

// GetMovies handles movie list requests
func (h *JellyfinHandler) GetMovies(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	limit := 100
	startIndex := 0

	movies, err := h.fetchMovies(limit, startIndex)
	if err != nil {
		log.Printf("Error fetching movies: %v", err)
		http.Error(w, fmt.Sprintf("Error fetching movies: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(movies)
}

// GetConfig returns Jellyfin configuration
func (h *JellyfinHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"jellyfinUrl": h.config.JellyfinURL,
		"userId":      h.config.JellyfinUserID,
		"apiKey":      h.config.JellyfinAPIKey,
	})
}

// SearchMovies searches for movies in Jellyfin
func (h *JellyfinHandler) SearchMovies(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	title := r.URL.Query().Get("title")
	if title == "" {
		http.Error(w, "Missing title parameter", http.StatusBadRequest)
		return
	}

	log.Printf("Searching Jellyfin for: %s", title)

	baseURL := fmt.Sprintf("%s/Users/%s/Items", h.config.JellyfinURL, h.config.JellyfinUserID)
	jellyfinURL, err := url.Parse(baseURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error parsing URL: %v", err), http.StatusInternalServerError)
		return
	}

	query := jellyfinURL.Query()
	query.Set("SearchTerm", title)
	query.Set("IncludeItemTypes", "Movie")
	query.Set("Recursive", "true")
	query.Set("Fields", "PrimaryImageAspectRatio,ProductionYear,ProviderIds")
	query.Set("ImageTypeLimit", "1")
	query.Set("EnableImageTypes", "Primary,Backdrop")
	query.Set("ParentId", h.config.ParentID)
	query.Set("Limit", "20")
	jellyfinURL.RawQuery = query.Encode()

	urlStr := jellyfinURL.String()
	log.Printf("Jellyfin URL: %s", urlStr)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	if h.config.JellyfinAPIKey != "" {
		req.Header.Set("X-Emby-Token", h.config.JellyfinAPIKey)
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

	var jellyfinResp models.JellyfinResponse
	if err := json.Unmarshal(body, &jellyfinResp); err != nil {
		http.Error(w, fmt.Sprintf("Error parsing response: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("Found %d movies for search '%s'", jellyfinResp.TotalRecordCount, title)
	for _, movie := range jellyfinResp.Items {
		log.Printf("  - %s (%d)", movie.Name, movie.ProductionYear)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jellyfinResp)
}

// fetchSeries fetches TV series from Jellyfin
func (h *JellyfinHandler) fetchSeries(limit int, startIndex int) (*models.JellyfinSeriesResponse, error) {
	url := fmt.Sprintf(
		"%s/Users/%s/Items?SortBy=DateCreated,SortName&SortOrder=Descending&IncludeItemTypes=Series&Recursive=true&Fields=PrimaryImageAspectRatio,ProviderIds&ImageTypeLimit=1&EnableImageTypes=Primary,Backdrop,Banner,Thumb&StartIndex=%d&ParentId=%s&Limit=%d",
		h.config.JellyfinURL,
		h.config.JellyfinUserID,
		startIndex,
		h.config.TVShowsParentID,
		limit,
	)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	if h.config.JellyfinAPIKey != "" {
		req.Header.Set("X-Emby-Token", h.config.JellyfinAPIKey)
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

	var jellyfinResp models.JellyfinSeriesResponse
	if err := json.Unmarshal(body, &jellyfinResp); err != nil {
		return nil, fmt.Errorf("error parsing response: %v", err)
	}

	return &jellyfinResp, nil
}

// GetSeries handles TV series list requests
func (h *JellyfinHandler) GetSeries(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	limit := 100
	startIndex := 0

	series, err := h.fetchSeries(limit, startIndex)
	if err != nil {
		log.Printf("Error fetching series: %v", err)
		http.Error(w, fmt.Sprintf("Error fetching series: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(series)
}
