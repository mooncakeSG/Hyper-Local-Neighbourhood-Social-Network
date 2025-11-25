// Quick test script to verify Groq API is working
// Run this in browser console or as a test

export async function testGroqAPI() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const model = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
  
  if (!apiKey) {
    console.error('❌ VITE_GROQ_API_KEY not found in environment variables');
    return { success: false, error: 'API key not configured' };
  }
  
  console.log('🔍 Testing Groq API...');
  console.log('📋 Model:', model);
  console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Always respond with text.',
          },
          {
            role: 'user',
            content: 'Say "Hello, Groq is working!" if you can read this.'
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Groq API Error:', response.status, errorData);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`,
        status: response.status,
        errorDetails: errorData
      };
    }
    
    const data = await response.json();
    
    // Debug: Log full response
    console.log('📦 Full Groq response:', data);
    
    // Check response structure
    if (!data.choices || data.choices.length === 0) {
      console.error('❌ No choices in response:', data);
      return {
        success: false,
        error: 'No choices in response',
        data: data
      };
    }
    
    const choice = data.choices[0];
    if (!choice || !choice.message) {
      console.error('❌ Invalid choice structure:', choice);
      return {
        success: false,
        error: 'Invalid choice structure',
        data: data
      };
    }
    
    const message = choice.message?.content;
    
    if (message && message.trim()) {
      console.log('✅ Groq API is working!');
      console.log('📝 Response:', message);
      console.log('🤖 Model used:', data.model);
      console.log('📊 Usage:', data.usage);
      return {
        success: true,
        message: message.trim(),
        model: data.model,
        usage: data.usage
      };
    } else {
      console.error('❌ Empty response content');
      console.error('   Full response:', JSON.stringify(data, null, 2));
      return {
        success: false,
        error: 'Empty response content',
        data: data,
        choice: choice
      };
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return {
      success: false,
      error: error.message,
      type: 'network_error'
    };
  }
}

// Auto-run if imported in browser console
if (typeof window !== 'undefined') {
  window.testGroqAPI = testGroqAPI;
  console.log('💡 Run testGroqAPI() in console to test Groq connection');
}

