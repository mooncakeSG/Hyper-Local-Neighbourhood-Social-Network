from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from pydantic import BaseModel, validator
from app.services.supabase_service import supabase_service
from app.services.auth_service import auth_service
from app.utils.validators import sanitize_string

router = APIRouter()

class UserUpdate(BaseModel):
    name: Optional[str] = None
    neighbourhood_id: Optional[str] = None
    onesignal_player_id: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            return sanitize_string(v, max_length=255)
        return v
    
    @validator('bio')
    def validate_bio(cls, v):
        if v is not None:
            return sanitize_string(v, max_length=500)
        return v

class UserResponse(BaseModel):
    id: str
    phone: Optional[str] = None
    name: Optional[str] = None
    neighbourhood_id: Optional[str] = None
    onesignal_player_id: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[str] = None

async def get_user_id(authorization: Optional[str] = Header(None, alias="Authorization")) -> str:
    """Extract and verify user ID from authorization header"""
    return await auth_service.get_user_id_from_token(authorization)

@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: str = Depends(get_user_id)):
    """Get current user profile"""
    try:
        user = await supabase_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    user_id: str = Depends(get_user_id)
):
    """Update current user profile"""
    try:
        update_data = user_update.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        supabase_service._ensure_client()
        result = (
            supabase_service.client.table("users")
            .update(update_data)
            .eq("id", user_id)
            .execute()
        )
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class NeighbourhoodUpdateRequest(BaseModel):
    neighbourhood_id: str

@router.get("/search")
async def search_users(
    q: str,
    limit: int = 10,
    user_id: str = Depends(get_user_id)
):
    """Search users in the same neighbourhood by name or email"""
    try:
        # Get current user's neighbourhood
        user = await supabase_service.get_user(user_id)
        if not user or not user.get("neighbourhood_id"):
            return []
        
        neighbourhood_id = user["neighbourhood_id"]
        
        # Search users in the same neighbourhood
        users = await supabase_service.search_users_in_neighbourhood(
            neighbourhood_id=neighbourhood_id,
            query=q,
            limit=limit
        )
        
        # Filter out current user
        users = [u for u in users if u.get("id") != user_id]
        
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me/stats")
async def get_user_stats(user_id: str = Depends(get_user_id)):
    """Get user activity statistics"""
    try:
        # Get counts for posts, comments, marketplace items, and businesses
        stats = await supabase_service.get_user_activity_stats(user_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/stats")
async def get_user_stats_by_id(
    user_id: str,
    current_user_id: str = Depends(get_user_id)
):
    """Get another user's activity statistics"""
    try:
        # Verify users are in same neighbourhood
        current_user = await supabase_service.get_user(current_user_id)
        target_user = await supabase_service.get_user(user_id)
        
        if not current_user or not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if target_user.get("neighbourhood_id") != current_user.get("neighbourhood_id"):
            raise HTTPException(status_code=403, detail="You can only view stats of users in your neighbourhood")
        
        stats = await supabase_service.get_user_activity_stats(user_id)
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/neighbourhood")
async def update_neighbourhood(
    request: NeighbourhoodUpdateRequest,
    user_id: str = Depends(get_user_id)
):
    """Update user's neighbourhood"""
    try:
        # First, check if user exists
        user = await supabase_service.get_user(user_id)
        
        # If user doesn't exist, create a basic user record
        if not user:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"User {user_id} not found in users table, creating basic record")
            
            # Create minimal user record with neighbourhood
            # Note: phone is required in schema (UNIQUE NOT NULL), so we use a unique placeholder
            # For email-based auth, we generate a unique phone value
            import uuid
            user_data = {
                "id": user_id,
                "phone": f"email-{str(uuid.uuid4())[:8]}",  # Unique placeholder for email-based users
                "name": None,
                "neighbourhood_id": request.neighbourhood_id
            }
            
            # Create user record
            supabase_service._ensure_client()
            try:
                result = supabase_service.client.table("users").insert(user_data).execute()
                
                if result.data:
                    logger.info(f"Created user record for {user_id}")
                    return result.data[0]
                else:
                    raise HTTPException(status_code=500, detail="Failed to create user record")
            except Exception as insert_error:
                # If insert fails (e.g., RLS policy, duplicate key), try to get the user
                logger.warning(f"Could not create user record: {insert_error}")
                # Try to get user again in case it was created by another process
                user = await supabase_service.get_user(user_id)
                if user:
                    # User now exists, update neighbourhood
                    updated_user = await supabase_service.update_user_neighbourhood(
                        user_id, request.neighbourhood_id
                    )
                    if updated_user:
                        return updated_user
                raise HTTPException(status_code=500, detail=f"Failed to create or update user: {str(insert_error)}")
        
        # User exists, update neighbourhood
        updated_user = await supabase_service.update_user_neighbourhood(
            user_id, request.neighbourhood_id
        )
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error updating neighbourhood: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

