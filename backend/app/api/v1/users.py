from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from pydantic import BaseModel
from app.services.supabase_service import supabase_service

router = APIRouter()

class UserUpdate(BaseModel):
    name: Optional[str] = None
    neighbourhood_id: Optional[str] = None
    onesignal_player_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str]
    neighbourhood_id: Optional[str]
    onesignal_player_id: Optional[str]

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract user ID from authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    try:
        return authorization.replace("Bearer ", "")
    except:
        raise HTTPException(status_code=401, detail="Invalid authorization")

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

@router.post("/neighbourhood")
async def update_neighbourhood(
    neighbourhood_id: str,
    user_id: str = Depends(get_user_id)
):
    """Update user's neighbourhood"""
    try:
        updated_user = await supabase_service.update_user_neighbourhood(
            user_id, neighbourhood_id
        )
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        return updated_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

