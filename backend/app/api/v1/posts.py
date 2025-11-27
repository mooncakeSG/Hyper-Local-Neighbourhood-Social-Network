from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
from pydantic import BaseModel, validator
import re
from app.services.supabase_service import supabase_service
from app.services.onesignal_service import onesignal_service
from app.services.auth_service import auth_service

router = APIRouter()

class PostCreate(BaseModel):
    content: str
    type: str = "post"  # "post" or "alert"
    image_url: Optional[str] = None
    
    @validator('content')
    def validate_content(cls, v):
        from app.utils.validators import sanitize_string
        return sanitize_string(v, max_length=5000)
    
    @validator('type')
    def validate_type(cls, v):
        if v not in ['post', 'alert']:
            raise ValueError("Type must be 'post' or 'alert'")
        return v

class PostResponse(BaseModel):
    id: str
    user_id: str
    neighbourhood_id: str
    content: str
    type: str
    created_at: str
    likes_count: Optional[int] = 0
    user_liked: Optional[bool] = False
    mentions: Optional[List[dict]] = []

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify user ID from authorization header"""
    return await auth_service.get_user_id_from_token(authorization)

def _parse_mentions(content: str) -> List[str]:
    """Extract @mentions from post content"""
    # Match @username or @email patterns
    mention_pattern = r'@(\w+(?:\.\w+)*@?\w*\.?\w*)'
    mentions = re.findall(mention_pattern, content)
    return list(set(mentions))  # Remove duplicates

@router.post("/", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    user_id: str = Depends(get_user_id)
):
    """Create a new post"""
    try:
        # Get user to get neighbourhood_id
        user = await supabase_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get("neighbourhood_id"):
            raise HTTPException(status_code=400, detail="User has no neighbourhood selected")
        
        # Create post
        post_data = {
            "user_id": user_id,
            "neighbourhood_id": user["neighbourhood_id"],
            "content": post.content,
            "type": post.type,
            "image_url": post.image_url,
        }
        
        created_post = await supabase_service.create_post(post_data)
        
        # Parse and create mentions
        mentions = _parse_mentions(post.content)
        if mentions:
            # Get user IDs from usernames/emails
            neighbourhood_users = await supabase_service.get_neighbourhood_users(
                user["neighbourhood_id"]
            )
            
            for mention_text in mentions:
                # Find user by name or email
                mentioned_user = None
                mention_clean = mention_text.strip('@').lower()
                
                for neighbourhood_user in neighbourhood_users:
                    user_name = (neighbourhood_user.get("name") or "").lower()
                    user_email = (neighbourhood_user.get("email") or "").lower()
                    
                    if mention_clean in user_name or mention_clean in user_email:
                        mentioned_user = neighbourhood_user
                        break
                
                if mentioned_user and mentioned_user["id"] != user_id:
                    await supabase_service.create_post_mention(
                        post_id=created_post["id"],
                        mentioned_user_id=mentioned_user["id"]
                    )
        
        # If it's an alert, send notifications
        if post.type == "alert":
            neighbourhood_users = await supabase_service.get_neighbourhood_users(
                user["neighbourhood_id"]
            )
            
            # Get OneSignal player IDs
            player_ids = [
                user["onesignal_player_id"]
                for user in neighbourhood_users
                if user.get("onesignal_player_id") and user["id"] != user_id
            ]
            
            if player_ids:
                neighbourhood_name = user.get("neighbourhood", {}).get("name", "Your neighbourhood")
                await onesignal_service.send_alert_notification(
                    player_ids=player_ids,
                    post_content=post.content,
                    post_id=created_post["id"],
                    neighbourhood_name=neighbourhood_name
                )
        
        return created_post
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[PostResponse])
async def get_posts(
    neighbourhood_id: str,
    limit: int = 50,
    authorization: Optional[str] = Header(None)
):
    """Get posts for a neighbourhood"""
    try:
        posts = await supabase_service.get_posts(neighbourhood_id, limit)
        
        # If user is authenticated, include like status and mentions for each post
        if authorization:
            try:
                user_id = await auth_service.get_user_id_from_token(authorization)
                # Add like status and mentions to each post
                for post in posts:
                    like = await supabase_service.get_post_like(post["id"], user_id)
                    post["user_liked"] = like is not None
                    # Ensure likes_count is included (from database or calculated)
                    if "likes_count" not in post or post["likes_count"] is None:
                        post["likes_count"] = await supabase_service.get_post_likes_count(post["id"])
                    # Get mentions for the post
                    mentions = await supabase_service.get_post_mentions(post["id"])
                    post["mentions"] = mentions
            except Exception:
                # If auth fails, just continue without like status
                pass
        else:
            # Even without auth, we can still include mentions (they're public)
            for post in posts:
                mentions = await supabase_service.get_post_mentions(post["id"])
                post["mentions"] = mentions
        
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}", response_model=List[PostResponse])
async def get_user_posts(
    user_id: str,
    limit: int = 50,
    authorization: Optional[str] = Header(None)
):
    """Get posts by a specific user"""
    try:
        # Verify requester is in same neighbourhood as target user
        if authorization:
            try:
                requester_id = await auth_service.get_user_id_from_token(authorization)
                requester = await supabase_service.get_user(requester_id)
                target_user = await supabase_service.get_user(user_id)
                
                if not requester or not target_user:
                    raise HTTPException(status_code=404, detail="User not found")
                
                if requester.get("neighbourhood_id") != target_user.get("neighbourhood_id"):
                    raise HTTPException(status_code=403, detail="You can only view posts from users in your neighbourhood")
            except HTTPException:
                raise
            except Exception:
                pass  # Continue without auth if it fails
        
        # Get user's posts
        posts = await supabase_service.get_posts_by_user(user_id, limit)
        
        # Add like status and mentions if authenticated
        if authorization:
            try:
                requester_id = await auth_service.get_user_id_from_token(authorization)
                for post in posts:
                    like = await supabase_service.get_post_like(post["id"], requester_id)
                    post["user_liked"] = like is not None
                    if "likes_count" not in post or post["likes_count"] is None:
                        post["likes_count"] = await supabase_service.get_post_likes_count(post["id"])
                    mentions = await supabase_service.get_post_mentions(post["id"])
                    post["mentions"] = mentions
            except Exception:
                pass
        
        return posts
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

