# Developer Mode

Developer mode allows you to work on the app without setting up Supabase authentication or phone OTP.

## How to Enable

### Option 1: Automatic (Recommended)
Developer mode is **automatically enabled** when running in development (`npm run dev`). You'll see a yellow "Developer Mode" banner on the auth page with a button to skip authentication.

### Option 2: Environment Variable
Add to your `.env` file:
```
VITE_DEV_MODE=true
```

### Option 3: Manual Toggle
The dev mode state is stored in localStorage. You can enable it manually:
```javascript
localStorage.setItem('dev-mode', 'true')
```

## What Developer Mode Does

1. **Bypasses Authentication**: No phone OTP required
2. **Creates Mock User**: Automatically creates a developer user
3. **Mock Neighbourhood**: Sets up a development neighbourhood
4. **Mock Data**: Feed shows sample posts (no database required)
5. **Console Logging**: Posts and comments are logged to console instead of being saved

## Features Available in Dev Mode

- ✅ View feed page
- ✅ Create posts (logged to console)
- ✅ Add comments (logged to console)
- ✅ Navigate between pages
- ✅ Test UI components
- ✅ Test routing

## Limitations

- Posts/comments are not persisted (only logged to console)
- No real database operations
- No notifications
- No real user data

## Disabling Developer Mode

To disable and use real authentication:
1. Remove `VITE_DEV_MODE=true` from `.env`
2. Clear localStorage: `localStorage.removeItem('dev-mode')`
3. Refresh the page

## Production

Developer mode is **automatically disabled** in production builds (`npm run build`). The `VITE_DEV_MODE` environment variable is only checked in development.

