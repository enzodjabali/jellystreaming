package handlers

import (
	"bytes"
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

// SonarrHandler handles Sonarr API requests
type SonarrHandler struct {
	config *config.Config
}

// NewSonarrHandler creates a new SonarrHandler
func NewSonarrHandler(cfg *config.Config) *SonarrHandler {
	return &SonarrHandler{config: cfg}
}

// AddSeries handles adding/updating a series in Sonarr
func (h *SonarrHandler) AddSeries(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" && r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	isUpdate := r.Method == "PUT"

	var req models.SonarrAddSeriesRequest
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

	sonarrURL := fmt.Sprintf("%s/api/v3/series", h.config.SonarrURL)
	client := &http.Client{Timeout: 30 * time.Second}

	method := "POST"
	if isUpdate {
		method = "PUT"
	}

	httpReq, err := http.NewRequest(method, sonarrURL, bytes.NewBuffer(jsonData))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	httpReq.Header.Set("X-Api-Key", h.config.SonarrAPIKey)
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

// GetQueue handles Sonarr queue requests
func (h *SonarrHandler) GetQueue(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "1"
	}
	pageSize := r.URL.Query().Get("pageSize")
	if pageSize == "" {
		pageSize = "50"
	}

	sonarrURL := fmt.Sprintf("%s/api/v3/queue?page=%s&pageSize=%s&sortDirection=ascending&sortKey=timeleft&includeUnknownSeriesItems=true&includeSeries=true&includeEpisode=true",
		h.config.SonarrURL, page, pageSize)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", sonarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", h.config.SonarrAPIKey)

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

// GetSeries handles getting all series from Sonarr
func (h *SonarrHandler) GetSeries(w http.ResponseWriter, r *http.Request) {
	sonarrURL := fmt.Sprintf("%s/api/v3/series", h.config.SonarrURL)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", sonarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", h.config.SonarrAPIKey)

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

// GetRootFolders handles getting Sonarr root folders
func (h *SonarrHandler) GetRootFolders(w http.ResponseWriter, r *http.Request) {
	sonarrURL := fmt.Sprintf("%s/api/v3/rootfolder", h.config.SonarrURL)

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", sonarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", h.config.SonarrAPIKey)

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

// Lookup handles series lookup in Sonarr
func (h *SonarrHandler) Lookup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	term := r.URL.Query().Get("term")
	if term == "" {
		http.Error(w, "Missing term parameter", http.StatusBadRequest)
		return
	}

	encodedTerm := url.QueryEscape(term)
	sonarrURL := fmt.Sprintf("%s/api/v3/series/lookup?term=%s", h.config.SonarrURL, encodedTerm)

	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest("GET", sonarrURL, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating request: %v", err), http.StatusInternalServerError)
		return
	}

	req.Header.Set("X-Api-Key", h.config.SonarrAPIKey)

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

// Refresh handles refreshing monitored downloads
func (h *SonarrHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sonarrURL := fmt.Sprintf("%s/api/v3/command", h.config.SonarrURL)

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

	req.Header.Set("X-Api-Key", h.config.SonarrAPIKey)
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
