/**
 * Backend API Client for NeighbourBot
 * Communicates with secure Python backend instead of calling Groq directly
 */

class BackendApiClient {
  constructor(backendUrl = 'http://localhost:8000') {
    this.backendUrl = backendUrl;
  }

  /**
   * Check if backend is available
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.backendUrl}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        status: 'error',
        groq_available: false,
        message: 'Backend server is not available'
      };
    }
  }

  /**
   * Send chat message to backend
   */
  async chat(message, conversationHistory = [], intents = [], context = {}) {
    try {
      const response = await fetch(`${this.backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.message
          })),
          intents,
          context
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Backend API error:', error);
      return {
        error: true,
        error_type: 'NETWORK_ERROR',
        error_message: error.message,
        response: 'Unable to connect to backend server. Please check if the server is running.'
      };
    }
  }

  /**
   * Format API response using backend
   */
  async formatResponse(intent, apiData, userQuery = '') {
    try {
      const response = await fetch(`${this.backendUrl}/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent,
          api_data: apiData,
          user_query: userQuery
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.formatted || null;
    } catch (error) {
      console.error('Format API error:', error);
      return null;
    }
  }

  /**
   * Test backend connection
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.backendUrl}/test`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Cannot connect to backend server'
      };
    }
  }
}

export default BackendApiClient;

