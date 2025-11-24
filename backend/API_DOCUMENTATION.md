# API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
All protected endpoints require an `Authorization` header:
```
Authorization: Bearer {user_id}
```

**Note:** In production, this should be a JWT token from Supabase. Currently using user_id for development.

---

## Comments API

### Create Comment
```http
POST /api/v1/comments/
Authorization: Bearer {user_id}
Content-Type: application/json

{
  "post_id": "uuid",
  "content": "Comment text"
}
```

**Response:**
```json
{
  "id": "uuid",
  "post_id": "uuid",
  "user_id": "uuid",
  "content": "Comment text",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Get Comments by Post
```http
GET /api/v1/comments/post/{post_id}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "content": "Comment text",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "user": {
      "id": "uuid",
      "name": "User Name",
      "phone": "+27123456789"
    }
  }
]
```

### Get Comment by ID
```http
GET /api/v1/comments/{comment_id}
```

### Update Comment
```http
PATCH /api/v1/comments/{comment_id}
Authorization: Bearer {user_id}
Content-Type: application/json

{
  "content": "Updated comment text"
}
```

**Note:** Only the comment author can update their comment.

### Delete Comment
```http
DELETE /api/v1/comments/{comment_id}
Authorization: Bearer {user_id}
```

**Note:** Only the comment author can delete their comment.

---

## Neighbourhoods API

### Get All Neighbourhoods
```http
GET /api/v1/neighbourhoods/?city={city}&province={province}&search={term}&limit={limit}
```

**Query Parameters:**
- `city` (optional): Filter by city
- `province` (optional): Filter by province
- `search` (optional): Search by neighbourhood name
- `limit` (optional): Maximum results (default: 100, max: 500)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Neighbourhood Name",
    "city": "Cape Town",
    "province": "Western Cape",
    "country": "South Africa",
    "latitude": -33.9249,
    "longitude": 18.4241,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Neighbourhood by ID
```http
GET /api/v1/neighbourhoods/{neighbourhood_id}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Neighbourhood Name",
  "city": "Cape Town",
  "province": "Western Cape",
  "country": "South Africa",
  "latitude": -33.9249,
  "longitude": 18.4241,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Posts API

### Create Post
```http
POST /api/v1/posts/
Authorization: Bearer {user_id}
Content-Type: application/json

{
  "content": "Post content",
  "type": "post",  // or "alert"
  "image_url": "https://..." // optional
}
```

### Get Posts
```http
GET /api/v1/posts/?neighbourhood_id={id}&limit={limit}
```

---

## Users API

### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer {user_id}
```

### Update Current User
```http
PATCH /api/v1/users/me
Authorization: Bearer {user_id}
Content-Type: application/json

{
  "name": "New Name",
  "neighbourhood_id": "uuid",
  "onesignal_player_id": "player-id"
}
```

### Update Neighbourhood
```http
POST /api/v1/users/neighbourhood
Authorization: Bearer {user_id}
Content-Type: application/json

{
  "neighbourhood_id": "uuid"
}
```

---

## Upload API

### Upload Image
```http
POST /api/v1/upload/image?folder={folder}
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: (required) Image file (JPEG, PNG, WebP, GIF)
- folder: (optional query param) Folder name (default: "posts")
```

**Query Parameters:**
- `folder` (optional): Folder name for organization (default: "posts")

**Response:**
```json
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/post-images/posts/user-id/uuid.jpg",
  "message": "Image uploaded successfully"
}
```

**File Requirements:**
- Types: JPEG, JPG, PNG, WebP, GIF
- Max size: 5MB
- Must be a valid image file

### Delete Image
```http
DELETE /api/v1/upload/image?image_url={url}
Authorization: Bearer {token}
```

**Query Parameters:**
- `image_url` (required): Public URL of the image to delete

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Notifications API

### Register OneSignal Player ID
```http
POST /api/v1/notifications/register
Authorization: Bearer {user_id}
Content-Type: application/json

{
  "player_id": "onesignal-player-id"
}
```

### Test Connection
```http
GET /api/v1/notifications/test-connection
```

### Test Send Notification
```http
POST /api/v1/notifications/test-send
Content-Type: application/json

{
  "player_id": "onesignal-player-id",
  "title": "Test Notification",
  "message": "This is a test"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Missing authorization"
}
```

### 403 Forbidden
```json
{
  "detail": "You can only update your own comments"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error message"
}
```

---

## Interactive API Documentation

Visit `http://localhost:8000/docs` for Swagger UI interactive documentation.

Visit `http://localhost:8000/redoc` for ReDoc documentation.

