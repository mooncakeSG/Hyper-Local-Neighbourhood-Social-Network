from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from pydantic import BaseModel
from app.services.supabase_service import supabase_service
from app.services.onesignal_service import onesignal_service

router = APIRouter()

class OneSignalPlayerId(BaseModel):
    player_id: str

class TestNotificationRequest(BaseModel):
    player_id: str
    title: Optional[str] = "Test Notification"
    message: Optional[str] = "This is a test notification from Neighbourhood Social Network"

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract user ID from authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    try:
        return authorization.replace("Bearer ", "")
    except:
        raise HTTPException(status_code=401, detail="Invalid authorization")

@router.get("/test-connection")
async def test_onesignal_connection():
    """Test OneSignal API connection and configuration"""
    try:
        # Check if credentials are set
        api_key = onesignal_service.api_key
        app_id = onesignal_service.app_id
        
        if not api_key or not app_id:
            return {
                "status": "error",
                "message": "OneSignal credentials not configured",
                "details": {
                    "api_key_set": bool(api_key),
                    "app_id_set": bool(app_id),
                    "help": "Set ONESIGNAL_API_KEY and ONESIGNAL_APP_ID in your .env file"
                }
            }
        
        # Try to send a test notification (this will validate the connection)
        # Note: This requires a valid player_id, so we'll just check config for now
        return {
            "status": "success",
            "message": "OneSignal is configured",
            "details": {
                "api_key_set": True,
                "app_id_set": True,
                "app_id": app_id[:10] + "..." if app_id else None,
                "api_url": onesignal_service.api_url,
                "note": "Use /test-send endpoint with a valid player_id to test sending"
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "details": {
                "error_type": type(e).__name__
            }
        }

@router.post("/test-send")
async def test_send_notification(request: TestNotificationRequest):
    """Test sending a notification to a specific player ID"""
    try:
        result = await onesignal_service.send_notification(
            player_ids=[request.player_id],
            title=request.title,
            message=request.message,
            data={"type": "test", "source": "api_test"}
        )
        
        return {
            "status": "success",
            "message": "Test notification sent successfully",
            "onesignal_response": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

@router.post("/register")
async def register_one_signal_player(
    player_data: OneSignalPlayerId,
    user_id: str = Depends(get_user_id)
):
    """Register OneSignal player ID for push notifications"""
    try:
        updated_user = await supabase_service.update_one_signal_id(
            user_id, player_data.player_id
        )
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "OneSignal player ID registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

