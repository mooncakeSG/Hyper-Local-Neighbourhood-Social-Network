# NeighbourBot Usage Guide

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configure Groq API (Recommended)

```bash
# Copy environment template
cp env.example .env

# Edit .env and add your Groq API key
# Get your key from https://console.groq.com/
VITE_GROQ_API_KEY=your_api_key_here
```

**Note**: The chatbot works without Groq, but AI features require an API key.

### 3. Development

```bash
npm run dev
```

The chatbot will be available at `http://localhost:3001`

### 3. Production Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Integration Methods

### Method 1: Iframe Embed (Recommended)

The simplest way to embed NeighbourBot is using an iframe:

```html
<iframe
  src="http://localhost:3001/?token=YOUR_JWT_TOKEN&neighbourhoodId=NEIGHBOURHOOD_ID&apiBase=/api/v1"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>
```

### Method 2: React Component

If you're using React, you can import the component directly:

```jsx
import NeighbourBot from './components/NeighbourBot';

function MyApp() {
  const jwtToken = 'your-jwt-token';
  const neighbourhoodId = 'neighbourhood-uuid';
  const apiBase = '/api/v1';

  return (
    <div style={{ width: '420px', height: '600px' }}>
      <NeighbourBot
        jwtToken={jwtToken}
        apiBase={apiBase}
        neighbourhoodId={neighbourhoodId}
        onNeighbourhoodUpdate={(newId) => {
          console.log('Neighbourhood updated:', newId);
          // Update your app state
        }}
      />
    </div>
  );
}
```

### Method 3: JavaScript Configuration

Configure via window object before loading:

```html
<script>
  window.neighbourbotToken = 'your-jwt-token';
  window.neighbourbotApiBase = '/api/v1';
  window.neighbourbotNeighbourhoodId = 'neighbourhood-uuid';
</script>
<iframe src="http://localhost:3001" width="100%" height="600px"></iframe>
```

## Example Queries

### View Content
- "Show recent posts"
- "What's happening in my neighbourhood?"
- "Show alerts"
- "What warnings are there?"

### Create Content
- "Create post: Hello neighbours!"
- "Alert: Water outage on Main Street"
- "Post: Community event this Saturday"

### Marketplace
- "Search item bicycle"
- "Find laptop"
- "List item: Bicycle for R500"
- "Sell: Old furniture for R200"

### Businesses
- "Business near restaurants"
- "Find shops"
- "What businesses are in my area?"

### Comments
- "Comment on post abc123: Great idea!"
- "Reply to post xyz789: Thanks for sharing"

### Notifications
- "Show notifications"
- "What alerts do I have?"

## Configuration

### Customizing Intents

Edit `chatbot.config.json` to add or modify intents:

```json
{
  "name": "custom_intent",
  "triggers": ["custom trigger", "another trigger"],
  "action": {
    "endpoint": "/api/v1/custom",
    "method": "GET"
  }
}
```

### Customizing UI

Modify the `ui_style` section in `chatbot.config.json`:

```json
{
  "ui_style": {
    "theme": "light",
    "colors": {
      "background": "#ffffff",
      "text": "#000000",
      "accent": "#000000"
    },
    "font": {
      "family": "Inter, Arial, sans-serif",
      "size": "14px"
    }
  }
}
```

## API Requirements

NeighbourBot expects the following API structure:

### Authentication
All requests must include JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Response Format
APIs should return data in one of these formats:

**Success with data:**
```json
{
  "id": "uuid",
  "data": [...],
  "message": "Success message"
}
```

**List response:**
```json
[
  {...},
  {...}
]
```

**Error response:**
```json
{
  "detail": "Error message",
  "error_code": "ERR_CODE"
}
```

## Context Management

The chatbot automatically manages:

- **Neighbourhood ID**: Stored in context and included in all requests
- **Session Memory**: Last 50 messages are remembered
- **User Preferences**: Can be stored and retrieved

Context persists across page refreshes using localStorage.

## Event Handling

### Neighbourhood Updates

Listen for neighbourhood changes when using iframe:

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'neighbourhood_updated') {
    const newNeighbourhoodId = event.data.neighbourhoodId;
    // Update your app's state
  }
});
```

## Troubleshooting

### Chatbot not loading
- Check that the development server is running
- Verify JWT token is valid
- Check browser console for errors

### API requests failing
- Verify API base URL is correct
- Check JWT token is included and valid
- Ensure CORS is configured on backend

### Intents not recognized
- Check trigger phrases in `chatbot.config.json`
- Verify message matches trigger patterns
- Check browser console for intent processing logs

### Context not persisting
- Check localStorage is enabled in browser
- Verify no privacy/incognito mode blocking storage
- Check browser console for storage errors

## Advanced Usage

### Custom Intent Handler

Extend `IntentHandler` class to add custom logic:

```javascript
import IntentHandler from './utils/intentHandler';

class CustomIntentHandler extends IntentHandler {
  extractEntities(message, intent) {
    const entities = super.extractEntities(message, intent);
    // Add custom entity extraction
    return entities;
  }
}
```

### Custom API Client

Extend `ApiClient` for custom request handling:

```javascript
import ApiClient from './utils/apiClient';

class CustomApiClient extends ApiClient {
  async request(endpoint, options = {}) {
    // Add custom request logic
    return super.request(endpoint, options);
  }
}
```

## Support

For more information, see:
- `README.md` - General documentation
- `PLATFORM_SUMMARY.md` - Platform API details
- `chatbot.config.json` - Configuration reference

