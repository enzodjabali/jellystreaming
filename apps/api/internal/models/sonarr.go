package models

// SonarrSeason represents a season in Sonarr
type SonarrSeason struct {
	SeasonNumber int                    `json:"seasonNumber"`
	Monitored    bool                   `json:"monitored"`
	Statistics   map[string]interface{} `json:"statistics,omitempty"`
}

// SonarrSeries represents a TV series in Sonarr
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

// SonarrAddSeriesRequest represents a request to add a series to Sonarr
type SonarrAddSeriesRequest struct {
	Id               int                    `json:"id,omitempty"`
	Title            string                 `json:"title"`
	QualityProfileId int                    `json:"qualityProfileId"`
	TitleSlug        string                 `json:"titleSlug"`
	Images           []map[string]string    `json:"images"`
	TvdbId           int                    `json:"tvdbId"`
	Year             int                    `json:"year"`
	Path             string                 `json:"path,omitempty"`
	RootFolderPath   string                 `json:"rootFolderPath"`
	Monitored        bool                   `json:"monitored"`
	SeasonFolder     bool                   `json:"seasonFolder"`
	Seasons          []SonarrSeason         `json:"seasons"`
	AddOptions       map[string]interface{} `json:"addOptions,omitempty"`
}

// SonarrQueueItem represents a download in Sonarr queue
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

// SonarrQueueResponse represents the response from Sonarr queue API
type SonarrQueueResponse struct {
	Page         int               `json:"page"`
	PageSize     int               `json:"pageSize"`
	TotalRecords int               `json:"totalRecords"`
	Records      []SonarrQueueItem `json:"records"`
}
