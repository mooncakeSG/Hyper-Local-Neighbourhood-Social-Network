"""
Likes API - Post likes/reactions
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from pydantic import BaseModel
from app.services.supabase_service import supabase_service
from app.services.auth_service import auth_service

router = APIRouter()

class LikeResponse(BaseModel):
    liked: bool
    likes_count: int

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify user ID from authorization header"""
    return await auth_service.get_user_id_from_token(authorization)

@router.post("/posts/{post_id}/like", response_model=LikeResponse)
async def like_post(
    post_id: str,
    user_id: str = Depends(get_user_id)
):
    """Like a post"""
    try:
        # Verify post exists and user has access
        post = await supabase_service.get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if user is in the same neighbourhood
        user = await supabase_service.get_user(user_id)
        if not user or not user.get("neighbourhood_id"):
            raise HTTPException(status_code=403, detail="User has no neighbourhood")
        
        if user["neighbourhood_id"] != post["neighbourhood_id"]:
            raise HTTPException(status_code=403, detail="Cannot like posts from other neighbourhoods")
        
        # Check if already liked
        existing_like = await supabase_service.get_post_like(post_id, user_id)
        if existing_like:
            raise HTTPException(status_code=400, detail="Post already liked")
        
        # Create like
        await supabase_service.create_post_like(post_id, user_id)
        
        # Get updated likes count
        likes_count = await supabase_service.get_post_likes_count(post_id)
        
        return {
            "liked": True,
            "likes_count": likes_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/posts/{post_id}/like", response_model=LikeResponse)
async def unlike_post(
    post_id: str,
    user_id: str = Depends(get_user_id)
):
    """Unlike a post"""
    try:
        # Verify post exists
        post = await supabase_service.get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if like exists
        existing_like = await supabase_service.get_post_like(post_id, user_id)
        if not existing_like:
            raise HTTPException(status_code=400, detail="Post not liked")
        
        # Delete like
        await supabase_service.delete_post_like(post_id, user_id)
        
        # Get updated likes count
        likes_count = await supabase_service.get_post_likes_count(post_id)
        
        return {
            "liked": False,
            "likes_count": likes_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/posts/{post_id}/like", response_model=LikeResponse)
async def get_post_like_status(
    post_id: str,
    user_id: str = Depends(get_user_id)
):
    """Get like status for a post"""
    try:
        # Verify post exists
        post = await supabase_service.get_post(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if user has liked the post
        existing_like = await supabase_service.get_post_like(post_id, user_id)
        liked = existing_like is not None
        
        # Get likes count
        likes_count = await supabase_service.get_post_likes_count(post_id)
        
        return {
            "liked": liked,
            "likes_count": likes_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

