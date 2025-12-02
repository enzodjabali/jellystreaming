# 🎬 JellyStreaming

A modern, full-stack streaming platform built with React and Go that connects to your Jellyfin media server to browse and play your movie collection.

## ✨ Features

- 🎥 Browse your complete Jellyfin movie library
- ▶️ Stream movies directly from Jellyfin
- 🎨 Beautiful, modern UI with movie posters and metadata
- 📱 Responsive design for all devices
- 🚀 Fast and lightweight
- 🐳 Docker support for easy deployment

## 🏗️ Architecture

The project is organized as a monorepo with two main applications:

```
jellystreaming/
├── apps/
│   ├── api/          # Go backend API
│   │   ├── main.go
│   │   ├── go.mod
│   │   └── Dockerfile
│   └── web/          # React frontend
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Backend (Go API)
- RESTful API built with Go
- Fetches movie data from Jellyfin
- CORS-enabled for frontend communication
- Health check endpoint

### Frontend (React)
- Modern React application
- Movie grid with posters and metadata
- Built-in video player
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Or: Node.js 18+ and Go 1.21+ for local development

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/enzodjabali/jellystreaming.git
cd jellystreaming
```

2. Start the services:
```bash
docker-compose up -d
```

3. Access the application:
- **Web App**: http://localhost:3000
- **API**: http://localhost:8080

### Local Development

#### Backend API
```bash
cd apps/api
go run main.go
```

The API will be available at `http://localhost:8080`

#### Frontend Web App
```bash
cd apps/web
npm install
npm start
```

The web app will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

#### API (apps/api)
- `JELLYFIN_URL` - Your Jellyfin server URL
- `JELLYFIN_USER_ID` - Your Jellyfin user ID
- `JELLYFIN_API_KEY` - Your Jellyfin API key
- `JELLYFIN_PARENT_ID` - Movies collection parent ID
- `PORT` - API server port (default: 8080)

#### Web App (apps/web)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8080)

## 📡 API Endpoints

### `GET /`
Returns API information and available endpoints

### `GET /api/movies`
Fetches all movies from your Jellyfin library

**Response:**
```json
{
  "Items": [
    {
      "Name": "Movie Title",
      "Id": "movie-id",
      "ProductionYear": 2024,
      "CommunityRating": 7.5,
      "RunTimeTicks": 7200000000,
      ...
    }
  ],
  "TotalRecordCount": 208,
  "StartIndex": 0
}
```

### `GET /api/config`
Returns Jellyfin configuration for the frontend

### `GET /health`
Health check endpoint

## 🎮 Usage

1. **Browse Movies**: The home page displays all your movies in a grid layout
2. **View Details**: Hover over a movie to see the play button
3. **Play Movie**: Click on a movie to open the video player
4. **Close Player**: Press ESC or click the X button to return to the library

## 🎨 Features

### Movie Grid
- Movie posters with fallback icons
- Title, year, runtime, and rating display
- Hover effects with play button overlay
- Responsive grid layout

### Video Player
- Full-screen video playback
- Direct streaming from Jellyfin
- Movie metadata display
- Keyboard shortcuts (ESC to close)
- Subtitle support (if available)

## 🐳 Docker Deployment

The project includes Docker configuration for both services:

### Build and run all services:
```bash
docker-compose up --build
```

### Stop all services:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

## 🔒 Security Notes

⚠️ **Important**: The API key is currently in the docker-compose.yml file. For production:
1. Use environment variables
2. Create a `.env` file (git-ignored)
3. Use secrets management (Docker Secrets, Kubernetes Secrets, etc.)

## 🛠️ Development

### Project Structure

```
apps/
├── api/
│   ├── main.go              # Main API server
│   ├── go.mod               # Go dependencies
│   └── Dockerfile           # API Docker image
└── web/
    ├── public/
    │   └── index.html       # HTML template
    ├── src/
    │   ├── App.js           # Main React component
    │   ├── App.css          # App styles
    │   ├── index.js         # React entry point
    │   ├── index.css        # Global styles
    │   └── components/
    │       ├── MovieList.js       # Movie grid component
    │       ├── MovieList.css
    │       ├── VideoPlayer.js     # Video player component
    │       └── VideoPlayer.css
    ├── package.json         # Dependencies
    ├── Dockerfile           # Web Docker image
    └── nginx.conf           # Nginx configuration
```

## 📦 Building for Production

### API
```bash
cd apps/api
CGO_ENABLED=0 GOOS=linux go build -o main .
```

### Web App
```bash
cd apps/web
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Jellyfin](https://jellyfin.org/) - The free software media system
- [React](https://react.dev/) - Frontend framework
- [Go](https://go.dev/) - Backend language

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ by [enzodjabali](https://github.com/enzodjabali)
