import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import IntentHandler from '../../utils/chatbot/intentHandler';
import ContextManager from '../../utils/chatbot/contextManager';
import ApiClient from '../../utils/chatbot/apiClient';
import GroqService from '../../utils/chatbot/groqService';
import BackendApiClient from '../../utils/chatbot/backendApiClient';
import ApiHealthCheck from '../../utils/chatbot/apiHealthCheck';
import config from '../../../chatbot.config.json';
import './NeighbourBot.css';

const NeighbourBot = ({ jwtToken, apiBase, neighbourhoodId, onNeighbourhoodUpdate, backendUrl, useBackend = true }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const messagesEndRef = useRef(null);
  const intentHandlerRef = useRef(null);
  const contextManagerRef = useRef(null);
  const apiClientRef = useRef(null);
  const groqServiceRef = useRef(null);
  const backendApiClientRef = useRef(null);
  const apiHealthCheckRef = useRef(null);

  // Initialize handlers and context
  useEffect(() => {
    intentHandlerRef.current = new IntentHandler(config.chatbot_config.intents);
    contextManagerRef.current = new ContextManager();
    const apiBaseUrl = apiBase || `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${config.chatbot_config.authentication.api_base}`;
    apiClientRef.current = new ApiClient(apiBaseUrl, jwtToken);
    
    // Initialize API health check (for main platform API, not chatbot backend)
    apiHealthCheckRef.current = new ApiHealthCheck(apiBaseUrl);
    
    // Check main platform API health in background (this is separate from chatbot backend)
    apiHealthCheckRef.current.quickCheck().then((isHealthy) => {
      if (!isHealthy) {
        console.warn('⚠️ Main platform API appears to be unavailable. Some API requests may fail.');
        console.warn('⚠️ Make sure your main platform server is running at:', apiBaseUrl);
        console.warn('ℹ️ Note: This is different from the chatbot backend (port 8000)');
      } else {
        console.log('✅ Main platform API is available');
      }
    }).catch(() => {
      console.warn('⚠️ Could not verify main platform API status');
    });
    
    // Initialize backend API client (secure server-side Groq)
    const actualBackendUrl = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const shouldUseBackend = useBackend && (actualBackendUrl || import.meta.env.VITE_BACKEND_URL);
    
    if (shouldUseBackend) {
      backendApiClientRef.current = new BackendApiClient(actualBackendUrl);
      
      console.log('🔗 Connecting to chatbot backend at:', actualBackendUrl);
      
      // Test backend connection
      backendApiClientRef.current.checkHealth().then((health) => {
        if (health.groq_available) {
          console.log('✅ Chatbot backend connected - Groq available server-side');
        } else if (health.status === 'ok') {
          console.warn('⚠️ Chatbot backend connected but Groq is not available');
        } else {
          console.warn('⚠️ Chatbot backend health check failed:', health.message);
        }
      }).catch((error) => {
        console.warn('⚠️ Chatbot backend not available. Falling back to client-side Groq.');
        console.warn('⚠️ Error:', error.message);
        console.warn('⚠️ Make sure chatbot backend is running at:', actualBackendUrl);
      });
    } else {
      console.log('ℹ️ Chatbot backend not configured. Using client-side Groq (if available).');
    }
    
    // Initialize Groq service (fallback if backend not used)
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    const groqModel = import.meta.env.VITE_GROQ_MODEL || 'llama-3.1-70b-versatile';
    groqServiceRef.current = new GroqService(groqApiKey, groqModel);
    
    // Test Groq connection in background (non-blocking)
    if (groqServiceRef.current && groqServiceRef.current.isAvailable) {
      groqServiceRef.current.testConnection().then((result) => {
        if (result.success) {
          console.log('✅ Groq API connected successfully');
        } else {
          console.warn('⚠️ Groq API test failed:', result.error);
          if (result.errorType === 'AUTH_ERROR') {
            console.warn('⚠️ Please check your VITE_GROQ_API_KEY in .env file');
          }
        }
      }).catch((error) => {
        console.error('Groq connection test error:', error);
      });
    } else {
      console.log('ℹ️ Groq API not configured. Using rule-based responses.');
    }
    
    // Load context from storage
    contextManagerRef.current.loadFromStorage();
    
    // Set neighbourhood if provided
    if (neighbourhoodId) {
      contextManagerRef.current.setNeighbourhood(neighbourhoodId);
    }

    // Add welcome message
    const welcomeMsg = config.chatbot_config.embedding.welcome_message;
    addMessage('assistant', welcomeMsg, {
      suggestions: config.chatbot_config.fallback.suggestions,
      onSuggestionClick: handleSuggestionClick,
    });
  }, []);

  // Update API client when token changes
  useEffect(() => {
    if (apiClientRef.current && jwtToken) {
      apiClientRef.current.setToken(jwtToken);
    }
  }, [jwtToken]);

  // Update neighbourhood in context
  useEffect(() => {
    if (neighbourhoodId && contextManagerRef.current) {
      contextManagerRef.current.setNeighbourhood(neighbourhoodId);
    }
  }, [neighbourhoodId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (role, message, metadata = {}) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    
    // Store in context manager
    if (contextManagerRef.current) {
      contextManagerRef.current.addToHistory(role, message, metadata);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleUserMessage(suggestion);
  };

  const replaceTemplate = (template, entities = {}) => {
    const context = contextManagerRef.current.getContext();
    let result = template;
    
    // Replace all template variables
    const allVars = { ...context, ...entities };
    for (const [key, value] of Object.entries(allVars)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    return result;
  };

  const executeAction = async (intent, entities) => {
    const action = intent.action;
    let endpoint = replaceTemplate(action.endpoint, entities);
    let body = null;

    if (action.body_template) {
      body = {};
      for (const [key, value] of Object.entries(action.body_template)) {
        body[key] = replaceTemplate(value, entities);
      }
    }

    try {
      setIsLoading(true);
      let response;

      switch (action.method) {
        case 'GET':
          response = await apiClientRef.current.get(endpoint);
          break;
        case 'POST':
          response = await apiClientRef.current.post(endpoint, body);
          break;
        case 'PATCH':
          response = await apiClientRef.current.patch(endpoint, body);
          break;
        case 'DELETE':
          response = await apiClientRef.current.delete(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${action.method}`);
      }

      // Format response - try Groq first, fallback to rule-based
      let responseMessage = formatResponse(intent, response);
      
      // Try to enhance response with Groq
      if (groqServiceRef.current) {
        const groqFormatted = await groqServiceRef.current.formatApiResponse(
          intent,
          response.data || response,
          contextManagerRef.current.getHistory().slice(-1)[0]?.message || ''
        );
        if (groqFormatted) {
          responseMessage.message = groqFormatted;
        }
      }
      
      addMessage('assistant', responseMessage.message, {
        data: response.data || response,
        dataType: getDataType(intent),
        suggestions: config.chatbot_config.fallback.suggestions,
        onSuggestionClick: handleSuggestionClick,
      });

      // Update neighbourhood if changed
      if (intent.name === 'update_neighbourhood' && response.data?.neighbourhood_id) {
        contextManagerRef.current.setNeighbourhood(response.data.neighbourhood_id);
        onNeighbourhoodUpdate?.(response.data.neighbourhood_id);
      }

      return response;
    } catch (error) {
      // Provide more helpful error messages
      let errorMessage = config.chatbot_config.responses.error;
      let showSuggestions = config.chatbot_config.fallback.suggestions;
      
      if (error.message) {
        if (error.message.includes('Backend API is not available') || error.message.includes('main platform API')) {
          errorMessage = 'The main platform API server is not running. This API is needed for actions like viewing posts, businesses, and marketplace items. The chatbot AI is working, but data features require the main platform server.';
          showSuggestions = [
            'Try asking a general question',
            'Ask about the platform features',
            'Get help with using the chatbot'
          ];
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
        } else if (error.message.includes('JSON') || error.message.includes('Unexpected response format')) {
          errorMessage = 'The main platform API server returned an unexpected response. The server may not be running or the endpoint does not exist.';
        } else if (error.message.includes('404')) {
          errorMessage = 'The requested endpoint was not found. The main platform API may not be running.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please check your JWT token.';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = 'You do not have permission to access this resource.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          // Show the error but make it user-friendly
          errorMessage = error.message.length > 100 
            ? `Error: ${error.message.substring(0, 100)}...` 
            : `Error: ${error.message}`;
        }
      }
      
      addMessage('assistant', errorMessage, {
        suggestions: showSuggestions,
        onSuggestionClick: handleSuggestionClick,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (intent, response) => {
    const data = response.data || response;
    
    switch (intent.name) {
      case 'get_recent_posts':
        return {
          message: Array.isArray(data) && data.length > 0
            ? `Here are the recent posts in your neighbourhood:`
            : `No recent posts found in your neighbourhood.`,
        };
      
      case 'get_alerts':
        return {
          message: Array.isArray(data) && data.length > 0
            ? `Here are the current alerts:`
            : `No alerts at the moment.`,
        };
      
      case 'create_post':
      case 'create_alert':
        return {
          message: `Successfully ${intent.name === 'create_post' ? 'posted' : 'created alert'}!`,
        };
      
      case 'comment_on_post':
        return {
          message: `Comment added successfully!`,
        };
      
      case 'search_marketplace':
        return {
          message: Array.isArray(data) && data.length > 0
            ? `Found ${data.length} item(s) in marketplace:`
            : `No items found matching your search.`,
        };
      
      case 'create_market_item':
        return {
          message: `Item listed successfully!`,
        };
      
      case 'search_businesses':
        return {
          message: Array.isArray(data) && data.length > 0
            ? `Found ${data.length} business(es):`
            : `No businesses found.`,
        };
      
      case 'get_notifications':
        return {
          message: Array.isArray(data) && data.length > 0
            ? `You have ${data.length} notification(s):`
            : `No notifications at the moment.`,
        };
      
      default:
        return {
          message: config.chatbot_config.responses.success.replace('{{message}}', 'Action completed successfully!'),
        };
    }
  };

  const getDataType = (intent) => {
    if (intent.name.includes('post')) return 'posts';
    if (intent.name.includes('marketplace') || intent.name.includes('market')) return 'marketplace';
    if (intent.name.includes('business')) return 'businesses';
    return null;
  };

  const handleUserMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    addMessage('user', message);
    setIsLoading(true);

    try {
      // Check if waiting for confirmation
      if (isWaitingForConfirmation && pendingAction) {
        const isConfirm = message.toLowerCase().includes('yes') || 
                         message.toLowerCase().includes('confirm') ||
                         message.toLowerCase() === 'y';
        
        if (isConfirm) {
          setIsWaitingForConfirmation(false);
          await executeAction(pendingAction.intent, pendingAction.entities);
          setPendingAction(null);
        } else {
          setIsWaitingForConfirmation(false);
          addMessage('assistant', 'Action cancelled.', {
            suggestions: config.chatbot_config.fallback.suggestions,
            onSuggestionClick: handleSuggestionClick,
          });
          setPendingAction(null);
        }
        return;
      }

      // Try AI service first for intelligent intent recognition
      let result = null;
      let groqResponse = null;
      let groqError = null;
      
      // Use backend API if available (more secure)
      if (useBackend && backendApiClientRef.current) {
        try {
          const conversationHistory = contextManagerRef.current.getHistory();
          const historyMessages = conversationHistory.map(msg => ({
            role: msg.role,
            message: msg.message
          }));
          
          groqResponse = await backendApiClientRef.current.chat(
            message,
            historyMessages,
            config.chatbot_config.intents,
            {
              neighbourhoodName: null, // Could be fetched from API if needed
            }
          );
          
          // Check if backend returned an error
          if (groqResponse && groqResponse.error) {
            groqError = groqResponse;
            groqResponse = null; // Clear response so we use fallback
            console.warn('Backend API error:', groqResponse.error_message);
          } else if (groqResponse && groqResponse.intent) {
            // Backend identified an intent
            const intent = config.chatbot_config.intents.find(i => i.name === groqResponse.intent);
            if (intent) {
              result = {
                intent,
                entities: groqResponse.entities || {},
                validation: { valid: true, missing: [] },
              };
            }
          }
        } catch (error) {
          console.error('Backend API error:', error);
          groqError = {
            error: true,
            errorType: 'UNKNOWN',
            errorMessage: 'Backend service temporarily unavailable. Using standard responses.',
          };
          groqResponse = null; // Fallback to rule-based
        }
      }
      // Fallback to client-side Groq if backend not used
      else if (groqServiceRef.current && groqServiceRef.current.isAvailable) {
        try {
          const conversationHistory = contextManagerRef.current.getHistory();
          groqResponse = await groqServiceRef.current.generateResponse(
            message,
            conversationHistory,
            config.chatbot_config.intents,
            {
              neighbourhoodName: null, // Could be fetched from API if needed
            }
          );
          
          // Check if Groq returned an error
          if (groqResponse && groqResponse.error) {
            groqError = groqResponse;
            groqResponse = null; // Clear response so we use fallback
            console.warn('Groq error:', groqResponse.errorMessage);
          } else if (groqResponse && groqResponse.intent) {
            // Groq identified an intent
            const intent = config.chatbot_config.intents.find(i => i.name === groqResponse.intent);
            if (intent) {
              result = {
                intent,
                entities: groqResponse.entities || {},
                validation: { valid: true, missing: [] },
              };
            }
          }
        } catch (error) {
          console.error('Groq service error:', error);
          groqError = {
            error: true,
            errorType: 'UNKNOWN',
            errorMessage: 'AI service temporarily unavailable. Using standard responses.',
          };
          groqResponse = null; // Fallback to rule-based
        }
      }

      // Fallback to rule-based intent matching
      if (!result) {
        result = intentHandlerRef.current.processMessage(message);
      }

      // If Groq provided a response but no intent, use it
      if (!result.intent && groqResponse && groqResponse.response && !groqResponse.error) {
        addMessage('assistant', groqResponse.response, {
          suggestions: config.chatbot_config.fallback.suggestions,
          onSuggestionClick: handleSuggestionClick,
        });
        return;
      }

      // If no intent found, use fallback
      if (!result.intent) {
        let fallbackMsg = config.chatbot_config.fallback.message;
        
        // Use Groq response if available and not an error
        if (groqResponse && groqResponse.response && !groqResponse.error) {
          fallbackMsg = groqResponse.response;
        }
        
        // Show error message if Groq failed (but don't block the conversation)
        if (groqError) {
          console.warn('Groq error, using fallback:', groqError.errorMessage);
        }
        
        addMessage('assistant', fallbackMsg, {
          suggestions: config.chatbot_config.fallback.suggestions,
          onSuggestionClick: handleSuggestionClick,
        });
        return;
      }

      // Validate required entities
      if (!result.validation.valid) {
        const missingMsg = groqResponse?.response || 
          `I need more information. Please provide: ${result.validation.missing.join(', ')}.`;
        addMessage('assistant', missingMsg, {
          suggestions: config.chatbot_config.fallback.suggestions,
          onSuggestionClick: handleSuggestionClick,
        });
        return;
      }

      // Check if confirmation is required
      if (result.intent.confirmation) {
        setIsWaitingForConfirmation(true);
        setPendingAction({ intent: result.intent, entities: result.entities });
        const confirmMsg = groqResponse?.response || 
          `Are you sure you want to ${result.intent.name.replace(/_/g, ' ')}? Type "yes" to confirm or "no" to cancel.`;
        addMessage('assistant', confirmMsg, {
          suggestions: ['Yes', 'No'],
          onSuggestionClick: handleSuggestionClick,
        });
        return;
      }

      // Execute action
      await executeAction(result.intent, result.entities);
    } catch (error) {
      console.error('Error handling message:', error);
      addMessage('assistant', config.chatbot_config.responses.error, {
        suggestions: config.chatbot_config.fallback.suggestions,
        onSuggestionClick: handleSuggestionClick,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="neighbourbot-container">
      <div className="chat-header">
        <h3>{config.chatbot_config.name}</h3>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            role={msg.role}
            timestamp={msg.timestamp}
            metadata={msg.metadata}
          />
        ))}
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        onSend={handleUserMessage}
        disabled={isLoading}
        placeholder="Ask about your neighbourhood..."
      />
    </div>
  );
};

export default NeighbourBot;

