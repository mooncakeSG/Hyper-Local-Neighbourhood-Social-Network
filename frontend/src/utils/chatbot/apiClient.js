/**
 * API Client for NeighbourBot
 * Handles all API requests to the backend with JWT authentication
 */

class ApiClient {
  constructor(baseUrl, jwtToken) {
    this.baseUrl = baseUrl || '/api/v1';
    this.jwtToken = jwtToken;
  }

  setToken(token) {
    this.jwtToken = token;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          console.error('Failed to parse JSON response:', text);
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
        }
      } else {
        // Non-JSON response (HTML error page, etc.)
        const text = await response.text();
        
        // Detect if it's an HTML error page (likely backend not running)
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error('Backend API is not available. The server may not be running or the endpoint does not exist. Please check your backend server.');
        }
        
        throw new Error(`Unexpected response format. Expected JSON but received: ${contentType || 'unknown format'}`);
      }
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      // Re-throw with more context
      if (error.message) {
        throw error;
      }
      throw new Error(`API request failed: ${error.message || 'Unknown error'}`);
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default ApiClient;

