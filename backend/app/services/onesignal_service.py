import os
import httpx
from typing import List, Dict, Any

class OneSignalService:
    def __init__(self):
        self.api_key = os.getenv("ONESIGNAL_API_KEY")
        self.app_id = os.getenv("ONESIGNAL_APP_ID")
        self.api_url = "https://onesignal.com/api/v1/notifications"
    
    def _ensure_config(self):
        """Ensure OneSignal is configured"""
        if not self.api_key or not self.app_id:
            raise ValueError("Missing OneSignal environment variables. Please set ONESIGNAL_API_KEY and ONESIGNAL_APP_ID in your .env file")
    
    async def send_notification(
        self,
        player_ids: List[str],
        title: str,
        message: str,
        data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Send push notification to OneSignal players"""
        self._ensure_config()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self.api_key}"
        }
        
        payload = {
            "app_id": self.app_id,
            "include_player_ids": player_ids,
            "headings": {"en": title},
            "contents": {"en": message},
        }
        
        if data:
            payload["data"] = data
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
    
    async def send_alert_notification(
        self,
        player_ids: List[str],
        post_content: str,
        post_id: str,
        neighbourhood_name: str
    ) -> Dict[str, Any]:
        """Send alert notification for neighbourhood alerts"""
        return await self.send_notification(
            player_ids=player_ids,
            title=f"🚨 Alert in {neighbourhood_name}",
            message=post_content[:100] + "..." if len(post_content) > 100 else post_content,
            data={
                "type": "alert",
                "post_id": post_id,
                "neighbourhood": neighbourhood_name
            }
        )

# Singleton instance - lazy initialization to avoid errors at import time
onesignal_service = OneSignalService()

