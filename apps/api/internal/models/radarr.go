package models

// RadarrAddMovieRequest represents a request to add a movie to Radarr
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

// RadarrQueueItem represents a download in Radarr queue
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

// RadarrQueueResponse represents the response from Radarr queue API
type RadarrQueueResponse struct {
	Page         int               `json:"page"`
	PageSize     int               `json:"pageSize"`
	TotalRecords int               `json:"totalRecords"`
	Records      []RadarrQueueItem `json:"records"`
}

// RadarrMovie represents a movie in Radarr
type RadarrMovie struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	TmdbId      int    `json:"tmdbId"`
	Monitored   bool   `json:"monitored"`
	HasFile     bool   `json:"hasFile"`
	IsAvailable bool   `json:"isAvailable"`
	Status      string `json:"status,omitempty"`
}
