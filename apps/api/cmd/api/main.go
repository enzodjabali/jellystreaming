package main

import (
	"log"
	"net/http"

	"jellystreaming/internal/config"
	"jellystreaming/internal/database"
	"jellystreaming/internal/routes"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	if err := database.Init(cfg.MongoDBURI, cfg.JWTSecret); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Setup routes
	routes.Setup(cfg)

	// Start server
	log.Printf("Starting JellyStreaming API on port %s", cfg.Port)
	log.Printf("Jellyfin URL: %s", cfg.JellyfinURL)

	if err := http.ListenAndServe(":"+cfg.Port, nil); err != nil {
		log.Fatal(err)
	}
}
