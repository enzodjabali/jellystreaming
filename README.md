# JellyStreaming

A full-stack streaming media management system that connects to Jellyfin, Radarr, and Sonarr with a beautiful React frontend and secure Go backend.

## Features

### Core Features
- Browse your complete Jellyfin movie and TV show collection
- Integrated HLS video player for streaming content
- Search and discover new content from TMDB
- Add movies via Radarr and TV shows via Sonarr
- Real-time download queue monitoring
- Season-by-season TV show management

### Authentication & Security
- **JWT-based authentication** with MongoDB
- **User management system** with admin and regular user roles
- **Password security** with bcrypt hashing
- **Protected API endpoints** - all routes require authentication
- Profile management and password changes
- Admin dashboard for user administration

### User Interface
- Modern, Netflix-inspired design
- Responsive layout for all devices
- Real-time status updates
- Smooth animations and transitions
- Dark mode optimized

### Integration
- **Jellyfin**: Stream your existing media library
- **Radarr**: Automated movie management
- **Sonarr**: Automated TV show management
- **TMDB**: Rich metadata and discovery

## Quick Start

### Prerequisites
- Docker & Docker Compose
- MongoDB Atlas account (or local MongoDB)
- Jellyfin, Radarr, and Sonarr instances
- TMDB API key

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/enzodjabali/jellystreaming.git
cd jellystreaming
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Required environment variables:
```bash
# Jellyfin
JELLYFIN_URL=https://your-jellyfin-url
JELLYFIN_USER_ID=your_user_id
JELLYFIN_PARENT_ID=your_parent_id
JELLYFIN_API_KEY=your_api_key

# TMDB
TMDB_TOKEN=your_tmdb_token

# Radarr
RADARR_URL=https://your-radarr-url
RADARR_API_KEY=your_radarr_key

# Sonarr
SONARR_URL=https://your-sonarr-url
SONARR_API_KEY=your_sonarr_key

# MongoDB (for authentication)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_strong_random_secret

# API Port
PORT=8080

# Frontend
REACT_APP_API_URL=http://localhost:8080
```

3. **Start the application**
```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:8080

4. **First login**
```
Username: admin
Password: admin
```
**Change the default password immediately!**

## Architecture

### Backend (Go)
- RESTful API with JWT authentication
- MongoDB for user management
- Proxies to Jellyfin, Radarr, Sonarr, and TMDB
- CORS enabled for frontend access

### Frontend (React)
- Single Page Application (SPA)
- Context API for authentication state
- Protected routes with role-based access
- Responsive design with CSS

### Database (MongoDB)
- User authentication and management
- bcrypt password hashing
- Unique username constraints

## API Endpoints

### Public
- `GET /health` - Health check

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Protected Endpoints (Require Auth)
All Jellyfin, Radarr, Sonarr, and TMDB endpoints require authentication.

## Running with Docker Compose

```bash
docker-compose up -d
```

This will start the API on `http://localhost:8080`

## Running locally

```bash
go run main.go
```

## Building the Docker image

```bash
docker build -t jellystreaming-api .
```

## Running the Docker container

```bash
docker run -p 8080:8080 \
  -e JELLYFIN_URL=https://watch.jellystreaming.ovh \
  -e JELLYFIN_USER_ID=700d4b2ee01941da951a1d2c716476cd \
  -e JELLYFIN_PARENT_ID=db4c1708cbb5dd1676284a40f2950aba \
  jellystreaming-api
```

## Example API Response

```json
{
  "Items": [
    {
      "Name": "Zootopie",
      "Id": "b16982ab131dd0cc0cac22879b17cc0d",
      "PremiereDate": "2016-02-11T00:00:00.0000000Z",
      "CommunityRating": 7.754,
      "OfficialRating": "FR-TP",
      "RunTimeTicks": 65251100000,
      "ProductionYear": 2016,
      "Container": "mkv",
      "HasSubtitles": true
    }
  ],
  "TotalRecordCount": 208,
  "StartIndex": 0
}
```

## Testing the API

```bash
# Get API info
curl http://localhost:8080/

# Get movies
curl http://localhost:8080/api/jellyfin/movies

# Health check
curl http://localhost:8080/health
```
