package routes

import (
	"encoding/json"
	"net/http"

	"jellystreaming/internal/config"
	"jellystreaming/internal/handlers"
	"jellystreaming/internal/middleware"
)

// Setup configures all application routes
func Setup(cfg *config.Config) {
	// Initialize handlers
	healthHandler := handlers.NewHealthHandler()
	authHandler := handlers.NewAuthHandler()
	jellyfinHandler := handlers.NewJellyfinHandler(cfg)
	tmdbHandler := handlers.NewTMDBHandler(cfg)
	radarrHandler := handlers.NewRadarrHandler(cfg)
	sonarrHandler := handlers.NewSonarrHandler(cfg)

	// Public routes
	http.HandleFunc("/health", middleware.EnableCORS(healthHandler.Check))

	// Authentication routes
	http.HandleFunc("/api/auth/login", middleware.EnableCORS(authHandler.Login))
	http.HandleFunc("/api/auth/verify", middleware.EnableCORS(middleware.Auth(authHandler.VerifyToken)))
	http.HandleFunc("/api/auth/me", middleware.EnableCORS(middleware.Auth(authHandler.GetCurrentUser)))
	http.HandleFunc("/api/auth/change-password", middleware.EnableCORS(middleware.Auth(authHandler.ChangePassword)))

	// User management routes (admin only)
	http.HandleFunc("/api/users", middleware.EnableCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			middleware.Admin(authHandler.ListUsers)(w, r)
		case http.MethodPost:
			middleware.Admin(authHandler.CreateUser)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/users/", middleware.EnableCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			middleware.Admin(authHandler.UpdateUser)(w, r)
		case http.MethodDelete:
			middleware.Admin(authHandler.DeleteUser)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	// Jellyfin routes
	http.HandleFunc("/api/jellyfin/movies", middleware.EnableCORS(middleware.Auth(jellyfinHandler.GetMovies)))
	http.HandleFunc("/api/config", middleware.EnableCORS(middleware.Auth(jellyfinHandler.GetConfig)))
	http.HandleFunc("/api/jellyfin/movies/search", middleware.EnableCORS(middleware.Auth(jellyfinHandler.SearchMovies)))
	http.HandleFunc("/api/jellyfin/series", middleware.EnableCORS(middleware.Auth(jellyfinHandler.GetSeries)))

	// TMDB routes
	http.HandleFunc("/api/tmdb/proxy", middleware.EnableCORS(middleware.Auth(tmdbHandler.Proxy)))
	http.HandleFunc("/api/tmdb/trending", middleware.EnableCORS(middleware.Auth(tmdbHandler.GetTrending)))
	http.HandleFunc("/api/tmdb/popular", middleware.EnableCORS(middleware.Auth(tmdbHandler.GetPopular)))
	http.HandleFunc("/api/tmdb/movie", middleware.EnableCORS(middleware.Auth(tmdbHandler.GetMovieDetails)))
	http.HandleFunc("/api/tmdb/genres", middleware.EnableCORS(middleware.Auth(tmdbHandler.GetGenres)))
	http.HandleFunc("/api/tmdb/discover", middleware.EnableCORS(middleware.Auth(tmdbHandler.Discover)))
	http.HandleFunc("/api/tmdb/search", middleware.EnableCORS(middleware.Auth(tmdbHandler.Search)))

	// Radarr routes
	http.HandleFunc("/api/radarr/movie", middleware.EnableCORS(middleware.Auth(radarrHandler.AddMovie)))
	http.HandleFunc("/api/radarr/queue", middleware.EnableCORS(middleware.Auth(radarrHandler.GetQueue)))
	http.HandleFunc("/api/radarr/movies", middleware.EnableCORS(middleware.Auth(radarrHandler.GetMovies)))
	http.HandleFunc("/api/radarr/rootfolders", middleware.EnableCORS(middleware.Auth(radarrHandler.GetRootFolders)))
	http.HandleFunc("/api/radarr/refresh", middleware.EnableCORS(middleware.Auth(radarrHandler.Refresh)))

	// Sonarr routes
	http.HandleFunc("/api/sonarr/series", middleware.EnableCORS(middleware.Auth(sonarrHandler.AddSeries)))
	http.HandleFunc("/api/sonarr/queue", middleware.EnableCORS(middleware.Auth(sonarrHandler.GetQueue)))
	http.HandleFunc("/api/sonarr/allseries", middleware.EnableCORS(middleware.Auth(sonarrHandler.GetSeries)))
	http.HandleFunc("/api/sonarr/rootfolders", middleware.EnableCORS(middleware.Auth(sonarrHandler.GetRootFolders)))
	http.HandleFunc("/api/sonarr/refresh", middleware.EnableCORS(middleware.Auth(sonarrHandler.Refresh)))
	http.HandleFunc("/api/sonarr/lookup", middleware.EnableCORS(middleware.Auth(sonarrHandler.Lookup)))

	// TMDB TV routes (order matters - most specific first)
	http.HandleFunc("/api/tmdb/tv/trending", middleware.EnableCORS(middleware.Auth(tmdbHandler.GetTVTrending)))
	http.HandleFunc("/api/tmdb/tv/popular", middleware.EnableCORS(middleware.Auth(tmdbHandler.GetTVPopular)))
	http.HandleFunc("/api/tmdb/tv/search", middleware.EnableCORS(middleware.Auth(tmdbHandler.SearchTV)))

	// TV details and external IDs router
	http.HandleFunc("/api/tmdb/tv/", middleware.EnableCORS(middleware.Auth(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		// Handle /api/tmdb/tv/{id}/external_ids
		if len(path) > len("/api/tmdb/tv/") && len(path) >= 13 {
			if path[len(path)-13:] == "/external_ids" {
				tmdbHandler.GetTVExternalIDs(w, r)
				return
			}
		}
		tmdbHandler.GetTVDetails(w, r)
	})))

	http.HandleFunc("/api/tmdb/tv", middleware.EnableCORS(middleware.Auth(tmdbHandler.GetTVDetails)))

	// Root handler
	http.HandleFunc("/", middleware.EnableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":        "JellyStreaming API",
			"version":        "2.2.0",
			"authentication": "JWT token required for most endpoints",
			"endpoints": map[string]string{
				"/health":                     "GET - Health check",
				"/api/auth/login":             "POST - Login with username/password",
				"/api/auth/verify":            "GET - Verify JWT token (requires auth)",
				"/api/auth/me":                "GET - Get current user info (requires auth)",
				"/api/auth/change-password":   "POST - Change own password (requires auth)",
				"/api/users":                  "GET/POST - List or create users (admin only)",
				"/api/users/:id":              "PUT/DELETE - Update or delete user (admin only)",
				"/api/jellyfin/movies":        "GET - Fetch movies from Jellyfin (requires auth)",
				"/api/jellyfin/movies/search": "GET - Search movie in Jellyfin (requires auth)",
				"/api/jellyfin/series":        "GET - Fetch TV shows from Jellyfin (requires auth)",
				"/api/config":                 "GET - Get Jellyfin configuration (requires auth)",
				"/api/tmdb/trending":          "GET - Get trending movies from TMDB (requires auth)",
				"/api/tmdb/popular":           "GET - Get popular movies from TMDB (requires auth)",
				"/api/tmdb/movie":             "GET - Get movie details from TMDB (requires auth)",
				"/api/tmdb/genres":            "GET - Get movie genres from TMDB (requires auth)",
				"/api/tmdb/discover":          "GET - Discover movies from TMDB (requires auth)",
				"/api/tmdb/search":            "GET - Search movies from TMDB (requires auth)",
				"/api/tmdb/tv/trending":       "GET - Get trending TV shows from TMDB (requires auth)",
				"/api/tmdb/tv/popular":        "GET - Get popular TV shows from TMDB (requires auth)",
				"/api/tmdb/tv":                "GET - Get TV show details from TMDB (requires auth)",
				"/api/tmdb/tv/search":         "GET - Search TV shows from TMDB (requires auth)",
				"/api/radarr/movie":           "POST - Add movie to Radarr (requires auth)",
				"/api/radarr/queue":           "GET - Get Radarr download queue (requires auth)",
				"/api/radarr/movies":          "GET - Get all movies in Radarr (requires auth)",
				"/api/radarr/rootfolders":     "GET - Get Radarr root folders (requires auth)",
				"/api/radarr/refresh":         "POST - Refresh Radarr monitored downloads (requires auth)",
				"/api/sonarr/series":          "POST - Add TV show to Sonarr (requires auth)",
				"/api/sonarr/queue":           "GET - Get Sonarr download queue (requires auth)",
				"/api/sonarr/allseries":       "GET - Get all TV shows in Sonarr (requires auth)",
				"/api/sonarr/rootfolders":     "GET - Get Sonarr root folders (requires auth)",
				"/api/sonarr/refresh":         "POST - Refresh Sonarr monitored downloads (requires auth)",
			},
		})
	}))
}
