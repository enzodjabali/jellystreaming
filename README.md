# JellyStreaming

A Go API that connects to your Jellyfin instance to fetch and display your movie collection.

## Features

- Fetches movies from your Jellyfin instance
- RESTful API endpoints
- Docker support for easy deployment
- Health check endpoint

## API Endpoints

- `GET /` - API information
- `GET /api/movies` - Fetch all movies from Jellyfin
- `GET /health` - Health check

## Environment Variables

- `JELLYFIN_URL` - Your Jellyfin server URL (default: https://watch.jellystreaming.ovh)
- `JELLYFIN_USER_ID` - Your Jellyfin user ID (default: 700d4b2ee01941da951a1d2c716476cd)
- `JELLYFIN_PARENT_ID` - Parent collection ID (default: db4c1708cbb5dd1676284a40f2950aba)
- `JELLYFIN_API_KEY` - Jellyfin API key (optional)
- `PORT` - Server port (default: 8080)

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
curl http://localhost:8080/api/movies

# Health check
curl http://localhost:8080/health
```
