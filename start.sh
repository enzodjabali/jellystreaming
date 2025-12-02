#!/bin/bash

echo "🎬 JellyStreaming Setup"
echo "======================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check API health
echo "🔍 Checking API health..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ API is healthy"
else
    echo "⚠️  API might not be ready yet, please wait a moment"
fi

echo ""
echo "================================================"
echo "✅ JellyStreaming is ready!"
echo "================================================"
echo ""
echo "📱 Web App:  http://localhost:3000"
echo "🔧 API:      http://localhost:8080"
echo ""
echo "To view logs:     docker-compose logs -f"
echo "To stop services: docker-compose down"
echo ""
echo "Enjoy your movies! 🍿"
