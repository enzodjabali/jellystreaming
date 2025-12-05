package config

import "os"

// Config holds all application configuration
type Config struct {
	JellyfinURL     string
	JellyfinUserID  string
	JellyfinAPIKey  string
	ParentID        string
	TVShowsParentID string
	Port            string
	TMDBToken       string
	RadarrURL       string
	RadarrAPIKey    string
	SonarrURL       string
	SonarrAPIKey    string
	MongoDBURI      string
	JWTSecret       string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		JellyfinURL:     getEnv("JELLYFIN_URL", "https://watch.jellystreaming.ovh"),
		JellyfinUserID:  getEnv("JELLYFIN_USER_ID", "700d4b2ee01941da951a1d2c716476cd"),
		JellyfinAPIKey:  getEnv("JELLYFIN_API_KEY", ""),
		ParentID:        getEnv("JELLYFIN_PARENT_ID", "db4c1708cbb5dd1676284a40f2950aba"),
		TVShowsParentID: getEnv("JELLYFIN_TVSHOWS_PARENT_ID", "d565273fd114d77bdf349a2896867069"),
		Port:            getEnv("PORT", "8080"),
		TMDBToken:       getEnv("TMDB_TOKEN", ""),
		RadarrURL:       getEnv("RADARR_URL", "https://radarr.jellystreaming.ovh"),
		RadarrAPIKey:    getEnv("RADARR_API_KEY", ""),
		SonarrURL:       getEnv("SONARR_URL", "https://sonarr.jellystreaming.ovh"),
		SonarrAPIKey:    getEnv("SONARR_API_KEY", ""),
		MongoDBURI:      getEnv("MONGODB_URI", ""),
		JWTSecret:       getEnv("JWT_SECRET", ""),
	}
}

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
