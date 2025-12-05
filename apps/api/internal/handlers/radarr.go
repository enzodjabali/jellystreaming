package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"jellystreaming/internal/config"
	"jellystreaming/internal/models"
)

// RadarrHandler handles Radarr API requests
type RadarrHandler struct {
	config *config.Config
}

// NewRadarrHandler creates a new RadarrHandler
func NewRadarrHandler(cfg *config.Config) *RadarrHandler {
	return &RadarrHandler{config: cfg}
}

// AddMovie handles adding a movie to Radarr
func (h *RadarrHandler) AddMovie(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.RadarrAddMovieRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set default values
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

	radarrURL := fmt.Sprintf("%s/api/v3/movie", h.config.RadarrURL)
	client := &http.Client{Timeout: 30 * time.Second}

	httpReq, err := http.NewRequest("POST", radarrURL, bytes.NewReader(jsonData))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	httpReq.Header.Set("X-Api-Key", h.config.RadarrAPIKey)
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

// GetQueue handles Radarr queue requests
func (h *RadarrHandler) GetQueue(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}
	pageSize := r.URL.Query().Get("pageSize")
	if pageSize == "" {
		pageSize = "50"
	}

	radarrURL := fmt.Sprintf("%s/api/v3/queue?page=%s&pageSize=%s&sortDirection=ascending&sortKey=timeleft&includeUnknownMovieItems=true",
		h.config.RadarrURL, page, pageSize)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", radarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", h.config.RadarrAPIKey)

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

// GetMovies handles getting all movies from Radarr
func (h *RadarrHandler) GetMovies(w http.ResponseWriter, r *http.Request) {
	radarrURL := fmt.Sprintf("%s/api/v3/movie", h.config.RadarrURL)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", radarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", h.config.RadarrAPIKey)

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

// GetRootFolders handles getting Radarr root folders
func (h *RadarrHandler) GetRootFolders(w http.ResponseWriter, r *http.Request) {
	radarrURL := fmt.Sprintf("%s/api/v3/rootfolder", h.config.RadarrURL)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", radarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", h.config.RadarrAPIKey)

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

// Refresh handles refreshing monitored downloads
func (h *RadarrHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	radarrURL := fmt.Sprintf("%s/api/v3/command", h.config.RadarrURL)

	commandBody := map[string]interface{}{
		"name": "RefreshMonitoredDownloads",
	}

	jsonBody, err := json.Marshal(commandBody)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("POST", radarrURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", h.config.RadarrAPIKey)
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
