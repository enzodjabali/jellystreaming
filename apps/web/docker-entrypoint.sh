#!/bin/sh
# Replace environment variable placeholders in config.js at runtime

# Default API URL if not set
API_URL="${REACT_APP_API_URL:-http://localhost:8080}"

# Replace placeholder in config.js with actual environment variable
sed -i "s|\${REACT_APP_API_URL}|${API_URL}|g" /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'
