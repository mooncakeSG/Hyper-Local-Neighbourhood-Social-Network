"""
Authentication service for verifying Supabase JWT tokens
"""
import os
import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from supabase import create_client

# Import production JWT verifier (optional, falls back to dev mode)
try:
    from app.services.jwt_verifier import jwt_verifier
    PRODUCTION_JWT_AVAILABLE = True
except ImportError:
    PRODUCTION_JWT_AVAILABLE = False

class AuthService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_anon_key:
            # Allow service to be created without config (for dev mode)
            self.supabase_client = None
        else:
            self.supabase_client = create_client(self.supabase_url, self.supabase_anon_key)
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify a Supabase JWT token and return the user data
        
        Uses production JWT verifier if available, falls back to dev mode.
        
        Args:
            token: JWT token from Authorization header
            
        Returns:
            Dictionary containing user information from token
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization token"
            )
        
        # Try production verification first
        if PRODUCTION_JWT_AVAILABLE:
            try:
                decoded_token = await jwt_verifier.verify_token(token)
                return {
                    "user_id": decoded_token.get("sub"),
                    "email": decoded_token.get("email"),
                    "phone": decoded_token.get("phone"),
                    "token_data": decoded_token
                }
            except HTTPException:
                raise
            except Exception:
                # Fall through to dev mode if production verification fails
                pass
        
        # Dev mode: decode without verification
        dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
        if not dev_mode:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token verification failed and dev mode is disabled"
            )
        
        try:
            decoded_token = jwt.decode(
                token,
                options={"verify_signature": False}
            )
            
            user_id = decoded_token.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing user ID"
                )
            
            return {
                "user_id": user_id,
                "email": decoded_token.get("email"),
                "phone": decoded_token.get("phone"),
                "token_data": decoded_token
            }
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.DecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token format: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}"
            )
    
    async def get_user_id_from_token(self, authorization: Optional[str]) -> str:
        """
        Extract and verify user ID from authorization header
        
        Supports both:
        1. JWT tokens from Supabase (starts with "eyJ")
        2. Simple user_id strings (dev mode)
        
        Args:
            authorization: Authorization header value (Bearer token or user_id)
            
        Returns:
            User ID string
            
        Raises:
            HTTPException: If authorization is invalid
        """
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization header"
            )
        
        # Remove "Bearer " prefix if present
        # Handle both "Bearer token" and "Bearer" (edge case)
        if authorization.startswith("Bearer "):
            token = authorization[7:]  # Remove "Bearer " (7 characters)
        elif authorization == "Bearer":
            # Edge case: just "Bearer" without token
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization: Bearer token is missing"
            )
        else:
            token = authorization
        
        # Check if it's a JWT token (starts with "eyJ" and is long enough)
        is_jwt = token.startswith("eyJ") and len(token) > 50
        
        if is_jwt:
            # Try to verify as JWT token
            try:
                user_data = await self.verify_token(token)
                return user_data["user_id"]
            except HTTPException as e:
                # If JWT verification fails, check if dev mode is enabled
                dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"  # Default to true
                if dev_mode:
                    # Dev mode: try to extract user_id from token payload without verification
                    try:
                        decoded = jwt.decode(token, options={"verify_signature": False})
                        user_id = decoded.get("sub")
                        if user_id:
                            return user_id
                        # If no sub in token, it's invalid
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid token: missing user ID"
                        )
                    except jwt.DecodeError:
                        # If decode fails completely, it's not a valid JWT
                        # In dev mode, don't treat as user_id - it's invalid
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid token format"
                        )
                    except HTTPException:
                        # Re-raise HTTP exceptions
                        raise
                else:
                    # Production: strict JWT verification required
                    raise
        else:
            # Not a JWT token, treat as user_id (dev mode)
            # In production, you might want to reject this
            dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"  # Default to true for backward compatibility
            if dev_mode:
                return token
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authorization: JWT token required"
                )

# Singleton instance
auth_service = AuthService()

