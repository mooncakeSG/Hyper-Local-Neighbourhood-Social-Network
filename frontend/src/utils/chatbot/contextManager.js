/**
 * Context Manager for NeighbourBot
 * Manages session memory, neighbourhood, and user intent storage
 */

class ContextManager {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.memory = {
      neighbourhood_id: null,
      user_intent: null,
      conversation_history: [],
      user_preferences: {},
    };
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store neighbourhood ID
   */
  setNeighbourhood(neighbourhoodId) {
    this.memory.neighbourhood_id = neighbourhoodId;
    this.saveToStorage();
  }

  /**
   * Get neighbourhood ID
   */
  getNeighbourhood() {
    return this.memory.neighbourhood_id;
  }

  /**
   * Store user intent
   */
  setUserIntent(intent) {
    this.memory.user_intent = intent;
    this.saveToStorage();
  }

  /**
   * Get user intent
   */
  getUserIntent() {
    return this.memory.user_intent;
  }

  /**
   * Add message to conversation history
   */
  addToHistory(role, message, metadata = {}) {
    this.memory.conversation_history.push({
      role, // 'user' or 'assistant'
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
    
    // Keep only last 50 messages
    if (this.memory.conversation_history.length > 50) {
      this.memory.conversation_history = this.memory.conversation_history.slice(-50);
    }
    
    this.saveToStorage();
  }

  /**
   * Get conversation history
   */
  getHistory(limit = null) {
    if (limit) {
      return this.memory.conversation_history.slice(-limit);
    }
    return this.memory.conversation_history;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.memory.conversation_history = [];
    this.saveToStorage();
  }

  /**
   * Get context for template replacement
   */
  getContext() {
    return {
      neighbourhood_id: this.memory.neighbourhood_id,
      session_id: this.sessionId,
      ...this.memory.user_preferences,
    };
  }

  /**
   * Replace template variables in string
   */
  replaceTemplate(template, additionalVars = {}) {
    const context = { ...this.getContext(), ...additionalVars };
    let result = template;
    
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    return result;
  }

  /**
   * Save to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(`neighbourbot_${this.sessionId}`, JSON.stringify(this.memory));
    } catch (error) {
      console.warn('Failed to save context to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(`neighbourbot_${this.sessionId}`);
      if (stored) {
        this.memory = { ...this.memory, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load context from storage:', error);
    }
  }

  /**
   * Reset context
   */
  reset() {
    this.memory = {
      neighbourhood_id: null,
      user_intent: null,
      conversation_history: [],
      user_preferences: {},
    };
    this.saveToStorage();
  }
}

export default ContextManager;

