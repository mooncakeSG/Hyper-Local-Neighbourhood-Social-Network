# OneSignal Connection Test Guide

## ✅ Test Results

Your OneSignal connection is **properly configured**!

- ✓ API Key: Set
- ✓ App ID: Set  
- ✓ Service Initialization: Success
- ✓ Configuration: Valid

## Testing Methods

### 1. Command Line Test Script

Run the test script:
```bash
cd backend
python test_onesignal.py
```

### 2. API Endpoint Test

#### Test Connection Status
```bash
GET http://localhost:8000/api/v1/notifications/test-connection
```

**Response:**
```json
{
  "status": "success",
  "message": "OneSignal is configured",
  "details": {
    "api_key_set": true,
    "app_id_set": true,
    "app_id": "bd7274fc-d...",
    "api_url": "https://onesignal.com/api/v1/notifications"
  }
}
```

#### Test Sending a Notification

**Note:** You need a valid OneSignal Player ID to test sending. Get this from your app after registering for push notifications.

```bash
POST http://localhost:8000/api/v1/notifications/test-send
Content-Type: application/json

{
  "player_id": "your-player-id-here",
  "title": "Test Notification",
  "message": "This is a test from the API"
}
```

**Using curl:**
```bash
curl -X POST http://localhost:8000/api/v1/notifications/test-send \
  -H "Content-Type: application/json" \
  -d '{
    "player_id": "your-player-id",
    "title": "Test",
    "message": "Test message"
  }'
```

**Using PowerShell:**
```powershell
$body = @{
    player_id = "your-player-id"
    title = "Test Notification"
    message = "This is a test"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/api/v1/notifications/test-send `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### 3. Interactive API Docs

Visit the Swagger UI for interactive testing:
```
http://localhost:8000/docs
```

Navigate to the `/api/v1/notifications` section to test endpoints.

## How It Works

1. **Configuration Check**: Verifies that `ONESIGNAL_API_KEY` and `ONESIGNAL_APP_ID` are set
2. **Service Initialization**: Creates the OneSignal service instance
3. **API Connection**: When sending, validates credentials with OneSignal API

## Integration Flow

1. User registers for push notifications in the app
2. App gets a OneSignal Player ID
3. App calls `POST /api/v1/notifications/register` with the player ID
4. Player ID is stored in the user's profile in Supabase
5. When an alert post is created, the backend:
   - Fetches all users in the neighbourhood
   - Gets their OneSignal Player IDs
   - Sends notifications via OneSignal API

## Troubleshooting

### "Missing OneSignal environment variables"
- Check that `.env` file exists in `backend/` directory
- Verify `ONESIGNAL_API_KEY` and `ONESIGNAL_APP_ID` are set
- Restart the server after changing `.env`

### "Failed to send notification"
- Verify the Player ID is valid
- Check that the app is registered with OneSignal
- Ensure the API key has proper permissions

### API returns 401 Unauthorized
- Verify your OneSignal REST API Key is correct
- Check that the key hasn't expired
- Ensure you're using the REST API Key, not the App ID

## Next Steps

1. ✅ OneSignal is configured
2. ⏳ Set up frontend to register Player IDs
3. ⏳ Test sending notifications from alert posts
4. ⏳ Verify notifications appear on devices

