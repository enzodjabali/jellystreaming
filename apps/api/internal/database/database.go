package database

import (
	"context"
	"errors"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"

	"jellystreaming/internal/models"
)

var (
	client          *mongo.Client
	UsersCollection *mongo.Collection
	JWTSecret       []byte
)

// Init initializes MongoDB connection
func Init(mongoURI, jwtSecret string) error {
	if mongoURI == "" {
		return errors.New("MONGODB_URI not provided")
	}

	if jwtSecret == "" {
		return errors.New("JWT_SECRET not provided")
	}

	JWTSecret = []byte(jwtSecret)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	client, err = mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		return err
	}

	// Ping the database to verify connection
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	UsersCollection = client.Database("jellystreaming").Collection("users")

	// Create unique index on username
	indexModel := mongo.IndexModel{
		Keys:    bson.D{{Key: "username", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	_, err = UsersCollection.Indexes().CreateOne(ctx, indexModel)
	if err != nil {
		log.Printf("Warning: Could not create unique index on username: %v", err)
	}

	log.Println("Connected to MongoDB successfully")

	// Create default admin user if no users exist
	if err := createDefaultAdmin(); err != nil {
		log.Printf("Warning: Could not create default admin: %v", err)
	}

	return nil
}

// createDefaultAdmin creates a default admin user if none exists
func createDefaultAdmin() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := UsersCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}

	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		defaultAdmin := models.User{
			Username:  "admin",
			Email:     "",
			Password:  string(hashedPassword),
			IsAdmin:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		_, err = UsersCollection.InsertOne(ctx, defaultAdmin)
		if err != nil {
			return err
		}

		log.Println("Created default admin user (username: admin, password: admin)")
		log.Println("Please change the default admin password immediately!")
	}

	return nil
}

// Close closes MongoDB connection
func Close() {
	if client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		client.Disconnect(ctx)
	}
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword compares a password with a hash
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
