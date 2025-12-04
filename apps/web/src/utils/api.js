// API utility for making authenticated requests

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/jellyfin/movies')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise} - Response promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // If unauthorized, redirect to login
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};

/**
 * Make a GET request
 */
export const apiGet = (endpoint) => {
  return apiRequest(endpoint, { method: 'GET' });
};

/**
 * Make a POST request
 */
export const apiPost = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Make a PUT request
 */
export const apiPut = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Make a DELETE request
 */
export const apiDelete = (endpoint) => {
  return apiRequest(endpoint, { method: 'DELETE' });
};

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};
