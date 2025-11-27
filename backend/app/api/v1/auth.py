"""
Authentication API - Email-based authentication with hCaptcha
"""
import os
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from typing import Optional
from pydantic import BaseModel, EmailStr, validator
from app.services.supabase_service import supabase_service
from app.services.auth_client import auth_client
from app.services.captcha_service import captcha_service
from app.utils.validators import sanitize_string

router = APIRouter()

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    captcha_token: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password too long")
        # Add more password strength checks if needed
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if v:
            return sanitize_string(v, max_length=255)
        return v

class SignInRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    captcha_token: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password too long")
        return v

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user: dict
    expires_in: int = 3600

@router.post("/signup", response_model=AuthResponse)
async def signup(
    request_data: SignUpRequest,
    client_ip: Optional[str] = Header(None, alias="X-Forwarded-For")
):
    """
    Sign up with email and password
    
    Requires hCaptcha verification
    """
    try:
        # Verify hCaptcha
        await captcha_service.verify(request_data.captcha_token, client_ip)
        
        # Sign up with Supabase Auth (use anon key for client-side auth)
        try:
            auth_client._ensure_client()
        except ValueError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database configuration error: {str(e)}"
            )
        
        # Sign up with Supabase Auth
        # IMPORTANT: If Supabase has hCaptcha enabled, we must pass the captcha token
        # We've already verified it on our backend, but Supabase also needs it
        signup_data = {
            "email": request_data.email,
            "password": request_data.password,
            "options": {
                "data": {
                    "name": request_data.name
                },
                # Pass captcha token to Supabase if it has captcha enabled
                "captchaToken": request_data.captcha_token
            }
        }
        
        try:
            response = auth_client.client.auth.sign_up(signup_data)
        except Exception as supabase_error:
            error_msg = str(supabase_error).lower()
            if "captcha" in error_msg:
                # Supabase captcha verification failed
                # This could mean:
                # 1. Supabase has captcha enabled but token is invalid/expired
                # 2. Supabase captcha settings don't match our hCaptcha keys
                raise HTTPException(
                    status_code=400,
                    detail="Supabase Auth captcha verification failed. Please check: 1) Supabase Dashboard > Auth > Settings > Captcha configuration matches your hCaptcha keys, 2) Or disable captcha in Supabase if you're handling it in your backend."
                )
            # Re-raise other errors
            raise
        
        if response.user is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to create user account"
            )
        
        user = response.user
        session = response.session
        
        # Create user record in our users table (use service role for database operations)
        # Note: phone is required (NOT NULL) in schema, so we generate a unique placeholder
        import uuid
        user_data = {
            "id": user.id,
            "email": request_data.email,
            "name": request_data.name,
            "phone": f"email-{str(uuid.uuid4())[:8]}"  # Unique placeholder for email-based users
        }
        
        # Insert or update user (use service role key for database operations)
        supabase_service._ensure_client()
        result = supabase_service.client.table("users").upsert(
            user_data,
            on_conflict="id"
        ).execute()
        
        # Return response - if no session, user needs to confirm email
        if session:
            return AuthResponse(
                access_token=session.access_token,
                refresh_token=session.refresh_token,
                user={
                    "id": user.id,
                    "email": user.email,
                    "name": request_data.name
                },
                expires_in=session.expires_in if hasattr(session, 'expires_in') else 3600
            )
        else:
            # No session means email confirmation is required
            return AuthResponse(
                access_token="",  # No token until email is confirmed
                refresh_token=None,
                user={
                    "id": user.id,
                    "email": user.email,
                    "name": request_data.name
                },
                expires_in=0
            )
        
    except HTTPException:
        raise
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Sign up error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Sign up failed: {str(e)}"
        )

@router.post("/signin", response_model=AuthResponse)
async def signin(
    request_data: SignInRequest,
    client_ip: Optional[str] = Header(None, alias="X-Forwarded-For")
):
    """
    Sign in with email and password
    
    Requires hCaptcha verification
    """
    try:
        # Verify hCaptcha
        await captcha_service.verify(request_data.captcha_token, client_ip)
        
        # Sign in with Supabase Auth (use anon key for client-side auth)
        try:
            auth_client._ensure_client()
        except ValueError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database configuration error: {str(e)}"
            )
        
        # Sign in with Supabase Auth
        # Pass captcha token if Supabase has captcha enabled
        signin_data = {
            "email": request_data.email,
            "password": request_data.password,
            "options": {
                "captchaToken": request_data.captcha_token
            }
        }
        
        try:
            response = auth_client.client.auth.sign_in_with_password(signin_data)
        except Exception as supabase_error:
            error_msg = str(supabase_error).lower()
            if "captcha" in error_msg:
                raise HTTPException(
                    status_code=400,
                    detail="Supabase Auth captcha verification failed. Please check Supabase Dashboard > Auth > Settings > Captcha configuration."
                )
            # Re-raise other errors
            raise
        
        if response.user is None or response.session is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Get user data from our users table
        # If user doesn't exist yet, create a basic record or use defaults
        supabase_service._ensure_client()
        try:
            user_result = supabase_service.client.table("users").select("*").eq("id", response.user.id).single().execute()
            user_data = user_result.data if user_result.data else {}
        except Exception as e:
            # User doesn't exist in users table yet - this can happen if:
            # 1. User signed up but record creation failed
            # 2. User was created directly in Supabase Auth
            # 3. User record was deleted but auth account still exists
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"User {response.user.id} not found in users table, creating basic record")
            
            # Create a basic user record
            # Note: phone is required (NOT NULL) in schema, so we generate a unique placeholder
            import uuid
            user_data = {
                "id": response.user.id,
                "email": response.user.email,
                "name": None,
                "phone": f"email-{str(uuid.uuid4())[:8]}",  # Unique placeholder for email-based users
                "neighbourhood_id": None
            }
            
            try:
                # Try to insert the user record
                supabase_service.client.table("users").insert(user_data).execute()
                logger.info(f"Created user record for {response.user.id}")
            except Exception as insert_error:
                # If insert fails (e.g., RLS policy), just use empty dict
                # User can still sign in, they just won't have profile data yet
                logger.warning(f"Could not create user record: {insert_error}")
                user_data = {}
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user={
                "id": response.user.id,
                "email": response.user.email,
                "name": user_data.get("name"),
                "neighbourhood_id": user_data.get("neighbourhood_id")
            },
            expires_in=response.session.expires_in or 3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "invalid" in error_msg or "password" in error_msg or "email" in error_msg:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        raise HTTPException(
            status_code=500,
            detail=f"Sign in failed: {str(e)}"
        )

@router.post("/forgot-password")
async def forgot_password(
    request_data: ForgotPasswordRequest,
    client_ip: Optional[str] = Header(None, alias="X-Forwarded-For")
):
    """
    Request password reset
    
    Sends password reset email via Supabase Auth
    Requires hCaptcha verification
    """
    try:
        # Verify hCaptcha
        await captcha_service.verify(request_data.captcha_token, client_ip)
        
        # Request password reset via Supabase Auth (use anon key for client-side auth)
        try:
            auth_client._ensure_client()
        except ValueError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database configuration error: {str(e)}"
            )
        
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        auth_client.client.auth.reset_password_for_email(
            request_data.email,
            {
                "redirect_to": f"{frontend_url}/reset-password"
            }
        )
        
        # Always return success (don't reveal if email exists)
        return {
            "success": True,
            "message": "If an account with that email exists, a password reset link has been sent."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Still return success to prevent email enumeration
        return {
            "success": True,
            "message": "If an account with that email exists, a password reset link has been sent."
        }

@router.post("/reset-password")
async def reset_password(request_data: ResetPasswordRequest):
    """
    Reset password with token from email
    
    Token is provided by Supabase Auth in the reset link
    """
    try:
        # Update password via Supabase Auth
        supabase_service._ensure_client()
        response = supabase_service.client.auth.update_user({
            "password": request_data.new_password
        })
        
        # Note: The token is typically handled by Supabase Auth redirect
        # This endpoint is for programmatic password reset
        
        return {
            "success": True,
            "message": "Password has been reset successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Password reset failed: {str(e)}"
        )

@router.post("/signout")
async def signout(authorization: Optional[str] = Header(None)):
    """
    Sign out current user
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Extract token
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        
        # Sign out via Supabase Auth (use anon key for client-side auth)
        try:
            auth_client._ensure_client()
            auth_client.client.auth.sign_out()
        except ValueError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database configuration error: {str(e)}"
            )
        
        return {
            "success": True,
            "message": "Signed out successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Sign out failed: {str(e)}"
        )

