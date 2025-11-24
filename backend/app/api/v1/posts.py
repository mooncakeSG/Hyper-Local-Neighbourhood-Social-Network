from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
from pydantic import BaseModel
from app.services.supabase_service import supabase_service
from app.services.onesignal_service import onesignal_service

router = APIRouter()

class PostCreate(BaseModel):
    content: str
    type: str = "post"  # "post" or "alert"
    image_url: Optional[str] = None

class PostResponse(BaseModel):
    id: str
    user_id: str
    neighbourhood_id: str
    content: str
    type: str
    created_at: str

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract user ID from authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    # In production, verify JWT token from Supabase
    # For now, assuming format: "Bearer {user_id}"
    try:
        return authorization.replace("Bearer ", "")
    except:
        raise HTTPException(status_code=401, detail="Invalid authorization")

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
    limit: int = 50
):
    """Get posts for a neighbourhood"""
    try:
        posts = await supabase_service.get_posts(neighbourhood_id, limit)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

