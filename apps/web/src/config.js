// Helper to get API URL from runtime config
export const getApiUrl = () => {
  // First try runtime config (loaded from public/config.js)
  if (window.APP_CONFIG && window.APP_CONFIG.API_URL) {
    const apiUrl = window.APP_CONFIG.API_URL;
    // Check if placeholder wasn't replaced (e.g., during local development)
    if (apiUrl && !apiUrl.includes('${')) {
      return apiUrl;
    }
  }
  
  // Fallback: try environment variable (for development)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Last resort: use current hostname with port 8080
  return `${window.location.protocol}//${window.location.hostname}:8080`;
};

export const API_URL = getApiUrl();
