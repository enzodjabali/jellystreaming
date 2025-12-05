// API utility for making authenticated requests
import { API_URL } from '../config';
import { ApiRequestOptions } from '../types';

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/api/jellyfin/movies')
 * @param options - Fetch options (method, body, etc.)
 * @returns Response promise
 */
export const apiRequest = async (endpoint: string, options: ApiRequestOptions = {}): Promise<Response> => {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
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
export const apiGet = (endpoint: string): Promise<Response> => {
  return apiRequest(endpoint, { method: 'GET' });
};

/**
 * Make a POST request
 */
export const apiPost = (endpoint: string, data: any): Promise<Response> => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Make a PUT request
 */
export const apiPut = (endpoint: string, data: any): Promise<Response> => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Make a DELETE request
 */
export const apiDelete = (endpoint: string): Promise<Response> => {
  return apiRequest(endpoint, { method: 'DELETE' });
};

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};
