# Backend - Neighbourhood Social Network API

FastAPI backend for the Neighbourhood Social Network platform.

## Setup

```bash
# Activate virtual environment
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run the server
uvicorn main:app --reload
```

## Running the Server

From the `backend/` directory:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or using Python directly:

```bash
python -m uvicorn main:app --reload
```

## API Endpoints

### Core
- `GET /` - API root
- `GET /health` - Health check

### Posts
- `POST /api/v1/posts/` - Create a post
- `GET /api/v1/posts/?neighbourhood_id={id}` - Get posts for neighbourhood

### Comments
- `POST /api/v1/comments/` - Create a comment
- `GET /api/v1/comments/post/{post_id}` - Get comments for a post
- `GET /api/v1/comments/{comment_id}` - Get comment by ID
- `PATCH /api/v1/comments/{comment_id}` - Update comment (author only)
- `DELETE /api/v1/comments/{comment_id}` - Delete comment (author only)

### Neighbourhoods
- `GET /api/v1/neighbourhoods/` - Get all neighbourhoods (with filters)
- `GET /api/v1/neighbourhoods/{id}` - Get neighbourhood by ID

### Users
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update user profile
- `POST /api/v1/users/neighbourhood` - Update user's neighbourhood

### Upload
- `POST /api/v1/upload/image` - Upload image file
- `DELETE /api/v1/upload/image` - Delete image file

### Marketplace
- `POST /api/v1/marketplace/` - Create marketplace item
- `GET /api/v1/marketplace/` - Get marketplace items (with filters)
- `GET /api/v1/marketplace/{item_id}` - Get item by ID
- `PATCH /api/v1/marketplace/{item_id}` - Update item (owner only)
- `DELETE /api/v1/marketplace/{item_id}` - Delete item (owner only)
- `GET /api/v1/marketplace/search` - Search items

### Businesses
- `POST /api/v1/businesses/` - Create business listing
- `GET /api/v1/businesses/` - Get business listings (with filters)
- `GET /api/v1/businesses/{business_id}` - Get business by ID
- `PATCH /api/v1/businesses/{business_id}` - Update business (owner only)
- `DELETE /api/v1/businesses/{business_id}` - Delete business (owner only)
- `GET /api/v1/businesses/search` - Search businesses

### Notifications
- `POST /api/v1/notifications/register` - Register OneSignal player ID
- `GET /api/v1/notifications/test-connection` - Test OneSignal connection
- `POST /api/v1/notifications/test-send` - Test send notification

See `API_DOCUMENTATION.md` for detailed API documentation.

## Environment Variables

Required in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ONESIGNAL_API_KEY=your_onesignal_api_key
ONESIGNAL_APP_ID=your_onesignal_app_id
```

## Deployment

Build Docker image:
```bash
docker build -t neighbourhood-api .
```

Run locally:
```bash
docker run -p 8000:8000 --env-file .env neighbourhood-api
```

## Notes

- The server will start even without environment variables, but API calls will fail with helpful error messages
- Make sure to set up your Supabase project and OneSignal account before using the API
