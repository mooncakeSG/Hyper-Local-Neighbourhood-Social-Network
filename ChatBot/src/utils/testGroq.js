/**
 * Test utility for Groq API connection
 * Can be called from browser console: testGroq()
 */

import GroqService from './groqService';

let testService = null;

export async function testGroq(apiKey = null) {
  // Get API key from parameter or environment
  const key = apiKey || import.meta.env.VITE_GROQ_API_KEY;
  
  if (!key) {
    console.error('❌ No Groq API key provided');
    console.log('Usage: testGroq("your_api_key_here") or set VITE_GROQ_API_KEY in .env');
    return {
      success: false,
      error: 'No API key provided',
    };
  }

  console.log('🧪 Testing Groq API connection...');
  console.log('API Key:', key.substring(0, 10) + '...' + key.substring(key.length - 4));
  
  // Create service instance
  testService = new GroqService(key);
  
  if (!testService.isAvailable) {
    console.error('❌ Failed to initialize Groq client');
    return {
      success: false,
      error: 'Failed to initialize Groq client',
    };
  }

  // Test connection
  const result = await testService.testConnection();
  
  if (result.success) {
    console.log('✅', result.message);
    console.log('✅ Groq API is working correctly!');
  } else {
    console.error('❌ Groq API test failed:', result.error);
    if (result.errorType) {
      console.error('Error Type:', result.errorType);
    }
  }
  
  return result;
}

// Make available globally for browser console testing
if (typeof window !== 'undefined') {
  window.testGroq = testGroq;
}

export default testGroq;

