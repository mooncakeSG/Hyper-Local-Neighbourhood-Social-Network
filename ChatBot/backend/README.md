# NeighbourBot Backend API

Secure Python backend for NeighbourBot chatbot. Keeps Groq API keys server-side for better security.

## Features

- 🔒 **Secure**: Groq API keys stored server-side, never exposed to client
- 🚀 **Fast**: FastAPI with async support
- 🛡️ **CORS**: Configured for frontend access
- 📝 **Documented**: Auto-generated API documentation
- 🔍 **Health Checks**: Built-in health monitoring
- ⚡ **Error Handling**: Comprehensive error handling and logging

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or using virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:

```env
GROQ_API_KEY=gsk_your_actual_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

### 3. Run the Server

```bash
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check with Groq status
- `GET /test` - Test Groq API connection

### Chat Endpoints
- `POST /chat` - Main chat endpoint (processes user messages)
- `POST /format` - Format API responses into natural language

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Usage

### Example Chat Request

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show recent posts",
    "conversation_history": [],
    "intents": [...],
    "context": {}
  }'
```

### Example Response

```json
{
  "intent": "get_recent_posts",
  "entities": {},
  "response": "I'll show you the recent posts in your neighbourhood.",
  "error": false
}
```

## Security Features

1. **API Key Protection**: Groq API key never exposed to client
2. **CORS Configuration**: Only allowed origins can access
3. **Error Handling**: No sensitive information leaked in errors
4. **Input Validation**: Pydantic models validate all inputs

## Frontend Integration

Update your frontend to use the backend API:

```javascript
// Instead of calling Groq directly
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    conversation_history: history,
    intents: intents,
    context: { neighbourhoodName: '...' }
  })
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Your Groq API key (required) | - |
| `GROQ_MODEL` | Groq model to use | `llama-3.1-70b-versatile` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3001` |

## Development

### Hot Reload

```bash
uvicorn app:app --reload
```

### Production

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

## Troubleshooting

### Groq API Key Not Working
- Check `.env` file exists and has correct key
- Verify key starts with `gsk_`
- Test with `/test` endpoint

### CORS Errors
- Add your frontend URL to `CORS_ORIGINS` in `.env`
- Restart server after changing `.env`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process using port 8000

## License

MIT

