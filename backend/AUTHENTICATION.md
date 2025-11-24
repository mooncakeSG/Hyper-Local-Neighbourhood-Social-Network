# Authentication Guide

## Overview

The backend now supports JWT token verification from Supabase. The authentication service can handle both:

1. **JWT Tokens** - Proper Supabase authentication tokens
2. **User IDs** - Simple user ID strings (dev mode, for backward compatibility)

## How It Works

### JWT Token Flow

1. User authenticates with Supabase (phone OTP)
2. Supabase returns a JWT access token
3. Frontend sends token in `Authorization: Bearer {token}` header
4. Backend verifies token and extracts user ID

### Dev Mode Flow

1. For development/testing, you can send user ID directly
2. Format: `Authorization: Bearer {user_id}`
3. Works when `DEV_MODE=true` in environment (default: enabled)

## Usage in API Endpoints

All protected endpoints use the `get_user_id` dependency:

```python
from app.services.auth_service import auth_service

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    return auth_service.get_user_id_from_token(authorization)

@router.post("/posts/")
async def create_post(
    post: PostCreate,
    user_id: str = Depends(get_user_id)  # Automatically extracts user_id
):
    # user_id is now verified
    ...
```

## Environment Variables

### Required for JWT Verification
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional
```
DEV_MODE=true  # Enable dev mode (allows user_id strings, default: true)
```

## Token Verification

### Current Implementation

- **Development**: Decodes JWT without signature verification (faster, less secure)
- **Production**: Should verify against Supabase's public key (RS256)

### Production Enhancement

For production, you should:

1. Fetch Supabase's public key from: `https://{project}.supabase.co/.well-known/jwks.json`
2. Verify token signature using RS256 algorithm
3. Check token expiration
4. Validate token claims

Example production verification:
```python
import httpx
from cryptography.hazmat.primitives import serialization

# Fetch public key
jwks_url = f"{self.supabase_url}/.well-known/jwks.json"
jwks = httpx.get(jwks_url).json()

# Verify token with public key
decoded = jwt.decode(
    token,
    public_key,
    algorithms=["RS256"],
    options={"verify_signature": True, "verify_exp": True}
)
```

## Testing

### Test with JWT Token
```bash
curl -X POST http://localhost:8000/api/v1/posts/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"content": "Test post"}'
```

### Test with User ID (Dev Mode)
```bash
curl -X POST http://localhost:8000/api/v1/posts/ \
  -H "Authorization: Bearer user-id-123" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test post"}'
```

## Security Notes

⚠️ **Current Implementation:**
- JWT tokens are decoded without signature verification (dev mode)
- User ID strings are accepted (dev mode)
- This is **NOT secure for production**

✅ **Production Requirements:**
- Enable signature verification
- Disable dev mode (`DEV_MODE=false`)
- Verify token expiration
- Validate all token claims
- Use HTTPS only

## Migration Path

1. ✅ **Phase 1 (Current)**: JWT decoding + dev mode support
2. ⏳ **Phase 2**: Add signature verification with public key
3. ⏳ **Phase 3**: Disable dev mode in production
4. ⏳ **Phase 4**: Add token refresh mechanism

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Missing authorization header"
}
```

### 401 Unauthorized (Invalid Token)
```json
{
  "detail": "Invalid token: missing user ID"
}
```

### 401 Unauthorized (Expired Token)
```json
{
  "detail": "Token has expired"
}
```

