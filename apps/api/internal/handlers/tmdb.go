package handlers

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"jellystreaming/internal/config"
)

// TMDBHandler handles TMDB API proxy requests
type TMDBHandler struct {
	config *config.Config
}

// NewTMDBHandler creates a new TMDBHandler
func NewTMDBHandler(cfg *config.Config) *TMDBHandler {
	return &TMDBHandler{config: cfg}
}

// makeRequest makes an HTTP request to TMDB API
func (h *TMDBHandler) makeRequest(tmdbURL string) ([]byte, int, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", tmdbURL, nil)
	if err != nil {
		return nil, 0, err
	}

	req.Header.Set("Authorization", "Bearer "+h.config.TMDBToken)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	return body, resp.StatusCode, err
}

// Proxy handles generic TMDB API proxy requests
func (h *TMDBHandler) Proxy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	endpoint := r.URL.Query().Get("endpoint")
	if endpoint == "" {
		http.Error(w, "Missing endpoint parameter", http.StatusBadRequest)
		return
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3%s", endpoint)
	queryParams := r.URL.Query()
	queryParams.Del("endpoint")

	if len(queryParams) > 0 {
		tmdbURL += "?" + queryParams.Encode()
	}

	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// GetTrending handles trending movies/tv requests
func (h *TMDBHandler) GetTrending(w http.ResponseWriter, r *http.Request) {
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

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/trending/%s/%s?language=en-US&page=%s", mediaType, timeWindow, page)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// GetPopular handles popular movies requests
func (h *TMDBHandler) GetPopular(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/movie/popular?language=en-US&page=%s", page)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// GetMovieDetails handles movie details requests
func (h *TMDBHandler) GetMovieDetails(w http.ResponseWriter, r *http.Request) {
	movieID := r.URL.Query().Get("id")
	if movieID == "" {
		http.Error(w, "Missing movie ID", http.StatusBadRequest)
		return
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/movie/%s?language=en-US&append_to_response=credits,videos,similar", movieID)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// GetGenres handles movie genres requests
func (h *TMDBHandler) GetGenres(w http.ResponseWriter, r *http.Request) {
	tmdbURL := "https://api.themoviedb.org/3/genre/movie/list?language=en-US"
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// Discover handles movie discovery requests
func (h *TMDBHandler) Discover(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()
	queryParams.Set("language", "en-US")

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/discover/movie?%s", queryParams.Encode())
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// Search handles movie search requests
func (h *TMDBHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Missing search query", http.StatusBadRequest)
		return
	}

	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	encodedQuery := url.QueryEscape(query)
	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/search/movie?query=%s&language=en-US&page=%s", encodedQuery, page)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// GetTVTrending handles trending TV shows requests
func (h *TMDBHandler) GetTVTrending(w http.ResponseWriter, r *http.Request) {
	timeWindow := r.URL.Query().Get("time_window")
	if timeWindow == "" {
		timeWindow = "week"
	}
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/trending/tv/%s?language=en-US&page=%s", timeWindow, page)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// GetTVPopular handles popular TV shows requests
func (h *TMDBHandler) GetTVPopular(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/tv/popular?language=en-US&page=%s", page)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// GetTVDetails handles TV show details requests
func (h *TMDBHandler) GetTVDetails(w http.ResponseWriter, r *http.Request) {
	tvID := r.URL.Query().Get("id")
	if tvID == "" {
		http.Error(w, "Missing TV show ID", http.StatusBadRequest)
		return
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/tv/%s?language=en-US&append_to_response=credits,videos,similar,seasons", tvID)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// GetTVExternalIDs handles TV show external IDs requests
func (h *TMDBHandler) GetTVExternalIDs(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	var tvID string
	fmt.Sscanf(path, "/api/tmdb/tv/%s/external_ids", &tvID)

	if tvID == "" {
		http.Error(w, "Missing TV show ID", http.StatusBadRequest)
		return
	}

	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/tv/%s/external_ids", tvID)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}

// SearchTV handles TV show search requests
func (h *TMDBHandler) SearchTV(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Missing search query", http.StatusBadRequest)
		return
	}

	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}

	encodedQuery := url.QueryEscape(query)
	tmdbURL := fmt.Sprintf("https://api.themoviedb.org/3/search/tv?query=%s&language=en-US&page=%s", encodedQuery, page)
	body, statusCode, err := h.makeRequest(tmdbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(body)
}
