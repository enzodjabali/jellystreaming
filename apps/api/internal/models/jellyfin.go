package models

// JellyfinMovie represents a movie from Jellyfin
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

// JellyfinResponse represents the response from Jellyfin API for movies
type JellyfinResponse struct {
	Items            []JellyfinMovie `json:"Items"`
	TotalRecordCount int             `json:"TotalRecordCount"`
	StartIndex       int             `json:"StartIndex"`
}

// JellyfinSeries represents a TV series from Jellyfin
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

// JellyfinSeriesResponse represents the response from Jellyfin API for series
type JellyfinSeriesResponse struct {
	Items            []JellyfinSeries `json:"Items"`
	TotalRecordCount int              `json:"TotalRecordCount"`
	StartIndex       int              `json:"StartIndex"`
}
