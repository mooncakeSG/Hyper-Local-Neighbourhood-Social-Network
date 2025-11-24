/**
 * API Health Check Utility
 * Checks if the backend API is available
 */

class ApiHealthCheck {
  constructor(apiBase) {
    this.apiBase = apiBase || '/api/v1';
    this.lastCheck = null;
    this.isHealthy = null;
  }

  /**
   * Check if API is healthy
   */
  async checkHealth() {
    try {
      // Try a simple endpoint that should exist (like /users/me or a health endpoint)
      // For now, we'll just check if we can reach the base URL
      const response = await fetch(`${this.apiBase}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      
      // If we get JSON back, API is likely working
      if (contentType && contentType.includes('application/json')) {
        this.isHealthy = true;
        this.lastCheck = new Date();
        return { healthy: true, message: 'API is available' };
      }
      
      // If we get HTML, backend is not running
      if (contentType && contentType.includes('text/html')) {
        this.isHealthy = false;
        this.lastCheck = new Date();
        return { 
          healthy: false, 
          message: 'Backend API is not available. Server may not be running.',
        };
      }

      // Other responses
      this.isHealthy = response.ok;
      this.lastCheck = new Date();
      return { 
        healthy: response.ok, 
        message: response.ok ? 'API is available' : 'API returned an error',
      };
    } catch (error) {
      this.isHealthy = false;
      this.lastCheck = new Date();
      
      if (error.message.includes('Failed to fetch')) {
        return {
          healthy: false,
          message: 'Cannot connect to backend API. Server may not be running.',
        };
      }
      
      return {
        healthy: false,
        message: `API health check failed: ${error.message}`,
      };
    }
  }

  /**
   * Quick check - just verify we can make a request
   */
  async quickCheck() {
    try {
      // Try to fetch any endpoint - if we get HTML back, backend isn't running
      const response = await fetch(`${this.apiBase}/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      
      // If we get HTML, backend is definitely not running
      if (contentType && contentType.includes('text/html')) {
        return false;
      }
      
      // Even if we get 401/403, that means backend is running
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default ApiHealthCheck;

