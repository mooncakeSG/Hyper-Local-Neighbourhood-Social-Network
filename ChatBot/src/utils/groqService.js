/**
 * Groq Service for NeighbourBot
 * Handles LLM interactions using Groq API
 */

import Groq from 'groq-sdk';

class GroqService {
  constructor(apiKey, model = 'llama-3.1-70b-versatile') {
    if (!apiKey) {
      console.warn('Groq API key not provided. Chatbot will use rule-based responses only.');
      this.client = null;
      this.isAvailable = false;
      return;
    }

    try {
      this.client = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Required for browser usage - API key will be exposed in client bundle
      });
      this.model = model;
      this.isAvailable = true;
      this.apiKey = apiKey; // Store for testing
    } catch (error) {
      console.error('Failed to initialize Groq client:', error);
      this.client = null;
      this.isAvailable = false;
    }
  }

  /**
   * Test if Groq API is working
   */
  async testConnection() {
    if (!this.client || !this.isAvailable) {
      return {
        success: false,
        error: 'Groq client not initialized. Check API key.',
      };
    }

    try {
      const testResponse = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a test assistant. Respond with "OK" if you can read this.',
          },
          {
            role: 'user',
            content: 'Test',
          },
        ],
        model: this.model,
        max_tokens: 10,
      });

      const response = testResponse.choices[0]?.message?.content;
      if (response) {
        return {
          success: true,
          message: 'Groq API connection successful',
        };
      } else {
        return {
          success: false,
          error: 'Groq API returned empty response',
        };
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      let errorType = 'UNKNOWN';

      if (error.message) {
        errorMessage = error.message;
        
        // Categorize errors
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorType = 'AUTH_ERROR';
          errorMessage = 'Invalid API key. Please check your Groq API key.';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          errorType = 'RATE_LIMIT';
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorType = 'SERVER_ERROR';
          errorMessage = 'Groq server error. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorType = 'NETWORK_ERROR';
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorType = 'TIMEOUT';
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      return {
        success: false,
        error: errorMessage,
        errorType: errorType,
        originalError: error,
      };
    }
  }

  /**
   * Build system prompt with context about the platform
   */
  buildSystemPrompt(intents, neighbourhoodName = null) {
    const intentDescriptions = intents.map(intent => {
      const triggers = intent.triggers.join(', ');
      return `- ${intent.name}: ${triggers}`;
    }).join('\n');

    return `You are NeighbourBot, an AI assistant for a hyper-local neighbourhood social network platform in South Africa.

Your purpose is to help users with:
- Viewing and creating neighbourhood posts and alerts
- Searching and listing items in the marketplace
- Finding local businesses
- Managing notifications
- Updating their neighbourhood

Available actions you can help users with:
${intentDescriptions}

Guidelines:
- Be friendly, helpful, and conversational
- Understand user queries and map them to available actions
- If a user wants to perform an action, clearly identify which intent it matches
- For ambiguous queries, ask clarifying questions
- Keep responses concise and natural
- Use South African context when relevant (e.g., currency in R, local terminology)
${neighbourhoodName ? `- The user is in the neighbourhood: ${neighbourhoodName}` : ''}

When responding, ALWAYS format your response as valid JSON. Use this exact format:

If a user wants to perform an action:
{
  "intent": "intent_name",
  "entities": { "key": "value" },
  "response": "Your natural language response to the user"
}

If no clear intent matches:
{
  "intent": null,
  "entities": {},
  "response": "Your helpful response explaining what you can help with"
}

IMPORTANT: Only return valid JSON. Do not include any text before or after the JSON object.`;
  }

  /**
   * Generate response using Groq
   */
  async generateResponse(userMessage, conversationHistory, intents, context = {}) {
    if (!this.client || !this.isAvailable) {
      return null;
    }

    try {
      // Build messages array
      const messages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(intents, context.neighbourhoodName),
        },
      ];

      // Add conversation history (last 10 messages for context)
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.message,
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Call Groq API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const completion = await this.client.chat.completions.create({
          messages: messages,
          model: this.model,
          temperature: 0.7,
          max_tokens: 500,
          // Note: JSON mode requires the model to support it and a JSON schema in the prompt
          // For now, we'll parse the response as JSON if possible
        });

        clearTimeout(timeoutId);

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) {
          console.warn('Groq returned empty response');
          return null;
        }

        // Parse JSON response
        try {
          const parsed = JSON.parse(responseContent);
          return parsed;
        } catch (parseError) {
          console.warn('Failed to parse Groq response as JSON:', parseError);
          // Try to extract JSON from response if it's wrapped in text
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              return JSON.parse(jsonMatch[0]);
            } catch (e) {
              // Fallback: return as plain response
              return {
                intent: null,
                entities: {},
                response: responseContent,
              };
            }
          }
          // Fallback: return as plain response
          return {
            intent: null,
            entities: {},
            response: responseContent,
          };
        }
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          throw new Error('Request timeout: Groq API took too long to respond');
        }
        throw abortError;
      }
    } catch (error) {
      console.error('Groq API error:', error);
      
      // Return structured error info
      return {
        error: true,
        errorType: this.categorizeError(error),
        errorMessage: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Categorize error type
   */
  categorizeError(error) {
    if (!error || !error.message) return 'UNKNOWN';

    const message = error.message.toLowerCase();
    
    if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api key')) {
      return 'AUTH_ERROR';
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return 'RATE_LIMIT';
    }
    if (message.includes('500') || message.includes('internal server')) {
      return 'SERVER_ERROR';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('timeout')) {
      return 'TIMEOUT';
    }
    if (message.includes('quota') || message.includes('exceeded')) {
      return 'QUOTA_EXCEEDED';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    const errorType = this.categorizeError(error);
    
    const errorMessages = {
      AUTH_ERROR: 'Invalid Groq API key. Please check your configuration.',
      RATE_LIMIT: 'Rate limit exceeded. Please try again in a moment.',
      SERVER_ERROR: 'Groq service is temporarily unavailable. Please try again later.',
      NETWORK_ERROR: 'Network error. Please check your internet connection.',
      TIMEOUT: 'Request timed out. The service may be slow. Please try again.',
      QUOTA_EXCEEDED: 'API quota exceeded. Please check your Groq account limits.',
      UNKNOWN: 'An error occurred with the AI service. Using fallback responses.',
    };

    return errorMessages[errorType] || errorMessages.UNKNOWN;
  }

  /**
   * Generate a natural language response for API results
   */
  async formatApiResponse(intent, apiData, userQuery = '') {
    if (!this.client || !this.isAvailable) {
      return null;
    }

    try {
      const prompt = `You are NeighbourBot. A user asked: "${userQuery}"

The API returned the following data:
${JSON.stringify(apiData, null, 2)}

Intent: ${intent.name}

Generate a friendly, natural response summarizing this data for the user. Be concise and helpful. If there's no data, explain that clearly.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for formatting

      try {
        const completion = await this.client.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are NeighbourBot, a helpful neighbourhood assistant. Generate concise, friendly responses.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: this.model,
          temperature: 0.7,
          max_tokens: 300,
        });

        clearTimeout(timeoutId);
        return completion.choices[0]?.message?.content || null;
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          console.warn('Groq formatting request timed out');
          return null;
        }
        throw abortError;
      }
    } catch (error) {
      console.error('Groq API error (formatting):', error);
      return null; // Silent fail for formatting - use rule-based response
    }
  }
}

export default GroqService;
