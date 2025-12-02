# JellyStreaming Web App

React-based web application for browsing and streaming movies from your Jellyfin server.

## Features

- 🎬 Browse movie library with beautiful poster grid
- ▶️ Built-in video player with direct Jellyfin streaming
- 📱 Fully responsive design
- ⚡ Fast and lightweight
- 🎨 Modern UI with smooth animations

## Quick Start

### Development
```bash
npm install
npm start
```

Runs on http://localhost:3000

### Production Build
```bash
npm run build
```

### Docker
```bash
docker build -t jellystreaming-web .
docker run -p 3000:80 jellystreaming-web
```

## Environment Variables

- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8080)

## Project Structure

```
src/
├── App.js                    # Main application component
├── App.css                   # App styles
├── index.js                  # React entry point
├── index.css                 # Global styles
└── components/
    ├── MovieList.js          # Movie grid component
    ├── MovieList.css         # Movie list styles
    ├── VideoPlayer.js        # Video player component
    └── VideoPlayer.css       # Video player styles
```

## Components

### App
Main application component that:
- Fetches movies from the API
- Manages application state
- Handles movie selection
- Displays loading and error states

### MovieList
Displays movies in a responsive grid with:
- Movie posters
- Title, year, runtime, rating
- Hover effects with play button
- Click to play functionality

### VideoPlayer
Full-screen video player with:
- Direct Jellyfin streaming
- Movie metadata display
- Subtitle support
- Keyboard shortcuts (ESC to close)

## Styling

The app uses CSS with:
- CSS Grid for responsive layouts
- CSS animations for smooth transitions
- Dark theme optimized for video content
- Mobile-first responsive design

## API Integration

The app communicates with the Go backend API:
- `GET /api/movies` - Fetch movie list
- `GET /api/config` - Get Jellyfin configuration

Videos are streamed directly from Jellyfin using the URL:
```
https://watch.jellystreaming.ovh/Videos/{movieId}/stream?Static=true&api_key={apiKey}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Tips

- Use React DevTools for debugging
- API calls are made on component mount
- Video player uses native HTML5 video element
- Poster images are cached by the browser

## Building

The production build is optimized with:
- Code splitting
- Minification
- Asset optimization
- Service worker for offline support (optional)

## Deployment

Built files are served with Nginx in production. The nginx.conf includes:
- SPA routing support
- Gzip compression
- Cache headers
- Security headers
