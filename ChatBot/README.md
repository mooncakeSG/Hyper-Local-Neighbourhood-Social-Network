# NeighbourBot 🤖

An intelligent chatbot assistant for the Hyper-Local Neighbourhood Social Network platform. NeighbourBot helps users interact with neighbourhood posts, alerts, marketplace, and business listings through natural language.

## Features

- 🧠 **AI-Powered**: Powered by Groq's LLM for intelligent, natural conversations
- 🎯 **Intent Recognition**: Understands user queries and extracts relevant information
- 💬 **Natural Language Processing**: Handles various phrasings and user inputs
- 🔐 **JWT Authentication**: Secure API integration with backend
- 📍 **Context Management**: Remembers neighbourhood and user preferences
- 💾 **Session Memory**: Maintains conversation history
- 🎨 **Modern UI**: Clean, responsive design with smooth animations
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 🔄 **Real-time Updates**: Fetches latest data from API

## Supported Intents

### Content Discovery
- **Get Recent Posts**: "Show recent posts", "What's happening", "Updates"
- **Get Alerts**: "Show alerts", "Warnings", "Urgent notifications"

### Content Creation
- **Create Post**: "Create post: [content]", "Share: [message]"
- **Create Alert**: "Alert: [message]", "Urgent: [warning]"
- **Comment on Post**: "Comment on post [id]: [comment]"

### Marketplace
- **Search Marketplace**: "Search item [query]", "Find [item]"
- **List Item**: "List item [title] for R[price]", "Sell [item]"

### Business Discovery
- **Search Businesses**: "Business near [query]", "Restaurants", "Shops"

### User Management
- **Get Notifications**: "Notifications", "Alerts for me"
- **Update Neighbourhood**: "Change neighbourhood [id]", "Update location"

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env and add your Groq API key

# Start development server
npm run dev

# Build for production
npm run build
```

### Groq API Setup

NeighbourBot uses Groq's LLM API for intelligent responses. To enable this:

1. **Get a Groq API Key**:
   - Visit [https://console.groq.com/](https://console.groq.com/)
   - Sign up or log in
   - Create an API key

2. **Configure Environment**:
   - Copy `env.example` to `.env`
   - Add your API key: `VITE_GROQ_API_KEY=your_api_key_here`
   - Optionally set model: `VITE_GROQ_MODEL=llama-3.1-70b-versatile`

3. **Available Models**:
   - `llama-3.1-70b-versatile` (default) - Best for general use
   - `llama-3.1-8b-instant` - Faster, lighter
   - `mixtral-8x7b-32768` - Alternative option

**Note**: The chatbot will work without Groq API (using rule-based responses), but AI-powered features require the API key.

**Security Note**: Groq API keys will be exposed in the browser bundle. For production, consider using a backend proxy to protect your API keys.

## Usage

### As a React Component

```jsx
import NeighbourBot from './components/NeighbourBot';

function App() {
  return (
    <NeighbourBot
      jwtToken="your-jwt-token"
      apiBase="/api/v1"
      neighbourhoodId="neighbourhood-uuid"
      onNeighbourhoodUpdate={(newId) => console.log('Neighbourhood updated:', newId)}
    />
  );
}
```

### As an Iframe Embed

```html
<iframe
  src="http://localhost:3001/?token=YOUR_JWT_TOKEN&neighbourhoodId=NEIGHBOURHOOD_ID&apiBase=/api/v1"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>
```

### Configuration via Window Object

```javascript
// Set configuration before loading iframe
window.neighbourbotToken = 'your-jwt-token';
window.neighbourbotApiBase = '/api/v1';
window.neighbourbotNeighbourhoodId = 'neighbourhood-uuid';
```

## Configuration

The chatbot behavior is configured in `chatbot.config.json`. Key settings include:

- **Intents**: Define what the bot can understand and do
- **UI Style**: Customize colors, fonts, and animations
- **Responses**: Configure success and error messages
- **Fallback**: Define behavior for unrecognized queries

## API Integration

NeighbourBot integrates with the following API endpoints:

- `GET /api/v1/posts` - Fetch posts
- `POST /api/v1/posts` - Create posts/alerts
- `POST /api/v1/comments` - Add comments
- `GET /api/v1/marketplace/search` - Search marketplace
- `POST /api/v1/marketplace` - List items
- `GET /api/v1/businesses` - Search businesses
- `GET /api/v1/notifications` - Get notifications
- `POST /api/v1/users/neighbourhood` - Update neighbourhood

All requests include JWT authentication via the `Authorization` header.

## Context Management

The chatbot maintains context across conversations:

- **Neighbourhood ID**: Automatically included in all requests
- **Session Memory**: Stores conversation history (last 50 messages)
- **User Intent**: Tracks current user goals
- **Preferences**: Stores user-specific settings

Context is persisted in localStorage and survives page refreshes.

## Customization

### Styling

Modify `chatbot.config.json` to customize:

```json
{
  "ui_style": {
    "theme": "light",
    "colors": {
      "background": "#ffffff",
      "text": "#000000",
      "accent": "#000000"
    }
  }
}
```

### Adding New Intents

Add new intents to `chatbot.config.json`:

```json
{
  "name": "new_intent",
  "triggers": ["trigger phrase 1", "trigger phrase 2"],
  "action": {
    "endpoint": "/api/v1/endpoint",
    "method": "GET"
  }
}
```

## Development

### Project Structure

```
ChatBot/
├── src/
│   ├── components/
│   │   ├── NeighbourBot.jsx      # Main chatbot component
│   │   ├── ChatMessage.jsx       # Message display component
│   │   └── ChatInput.jsx         # Input component
│   ├── utils/
│   │   ├── apiClient.js          # API client
│   │   ├── intentHandler.js      # Intent recognition
│   │   └── contextManager.js     # Context management
│   ├── index.jsx                 # Entry point
│   └── index.css                 # Global styles
├── public/
│   └── index.html                # HTML template
├── chatbot.config.json           # Bot configuration
├── package.json
└── vite.config.js
```

### Adding Features

1. **New Intent**: Add to `chatbot.config.json` and update `intentHandler.js` if needed
2. **New UI Component**: Create in `src/components/`
3. **New API Endpoint**: Add method to `apiClient.js`

## Testing

```bash
# Run linter
npm run lint

# Build and preview
npm run build
npm run preview
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues and questions, please refer to the main platform documentation in `PLATFORM_SUMMARY.md`.

