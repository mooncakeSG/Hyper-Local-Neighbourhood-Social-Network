# Email Authentication Setup Guide

## Overview

The authentication system has been migrated from phone-based OTP to email-based authentication with password and hCaptcha protection.

## Backend Setup

### 1. Environment Variables

Add to `backend/.env`:

```env
# hCaptcha Configuration
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key

# Frontend URL (for password reset redirects)
FRONTEND_URL=http://localhost:5173
```

### 2. Database Migration

Run `database/auth_migration.sql` in Supabase SQL Editor to:
- Add `email` column to users table
- Add password reset token columns
- Create indexes

### 3. Supabase Auth Configuration

In Supabase Dashboard:
1. Go to Authentication > Settings
2. Enable Email provider
3. Configure email templates for:
   - Sign up confirmation
   - Password reset
4. Set redirect URLs:
   - Site URL: `http://localhost:5173` (development)
   - Redirect URLs: Add `http://localhost:5173/reset-password`

## Frontend Setup

### 1. Environment Variables

Add to `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Install Dependencies

```bash
cd frontend
npm install @hcaptcha/react-hcaptcha
```

### 3. hCaptcha Setup

1. Sign up at https://www.hcaptcha.com/
2. Create a site
3. Get your Site Key and Secret Key
4. Add Site Key to frontend `.env`
5. Add Secret Key to backend `.env`

## API Endpoints

### Sign Up
```
POST /api/v1/auth/signup
Body: {
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name" (optional),
  "captcha_token": "hcaptcha_token"
}
```

### Sign In
```
POST /api/v1/auth/signin
Body: {
  "email": "user@example.com",
  "password": "password123",
  "captcha_token": "hcaptcha_token"
}
```

### Forgot Password
```
POST /api/v1/auth/forgot-password
Body: {
  "email": "user@example.com",
  "captcha_token": "hcaptcha_token"
}
```

### Sign Out
```
POST /api/v1/auth/signout
Headers: Authorization: Bearer {token}
```

## Password Reset Flow

1. User clicks "Forgot password" on sign-in page
2. Enters email and completes hCaptcha
3. Backend sends password reset email via Supabase
4. User clicks link in email
5. Redirected to `/reset-password` with token in URL hash
6. User enters new password and completes hCaptcha
7. Password is updated via Supabase Auth

## Security Features

- ✅ hCaptcha on all auth endpoints
- ✅ Password strength validation (min 8 characters)
- ✅ Email validation
- ✅ Input sanitization
- ✅ Rate limiting (via middleware)
- ✅ Secure password reset flow

## Testing

### Test Sign Up
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "captcha_token": "test_token"
  }'
```

### Test Sign In
```bash
curl -X POST http://localhost:8000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "captcha_token": "test_token"
  }'
```

## Migration Notes

- Existing phone-based users will need to sign up with email
- Phone column remains in database for backward compatibility
- Old phone OTP flow is replaced with email/password

## Files Modified

### Backend
- `app/api/v1/auth.py` - New authentication API
- `app/services/captcha_service.py` - hCaptcha verification
- `main.py` - Added auth router
- `database/auth_migration.sql` - Database migration

### Frontend
- `src/pages/AuthPage.jsx` - Email sign in/up with hCaptcha
- `src/pages/ResetPasswordPage.jsx` - Password reset page
- `src/App.jsx` - Added reset password route
- `package.json` - Added @hcaptcha/react-hcaptcha

