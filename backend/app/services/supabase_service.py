import os
from supabase import create_client, Client
from typing import Optional, Dict, Any, List

class SupabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.url or not self.service_role_key:
            # Don't raise error at init - allow lazy initialization
            self.client = None
        else:
            self.client: Client = create_client(self.url, self.service_role_key)
    
    def _ensure_client(self):
        """Ensure client is initialized"""
        if self.client is None:
            if not self.url or not self.service_role_key:
                raise ValueError("Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file")
            self.client = create_client(self.url, self.service_role_key)
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        self._ensure_client()
        result = self.client.table("users").select("*").eq("id", user_id).execute()
        return result.data[0] if result.data else None
    
    async def get_neighbourhood_users(self, neighbourhood_id: str) -> List[Dict[str, Any]]:
        """Get all users in a neighbourhood"""
        self._ensure_client()
        result = self.client.table("users").select("*").eq("neighbourhood_id", neighbourhood_id).execute()
        return result.data or []
    
    async def create_post(self, post_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new post"""
        self._ensure_client()
        result = self.client.table("posts").insert(post_data).execute()
        return result.data[0] if result.data else None
    
    async def get_posts(self, neighbourhood_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get posts for a neighbourhood"""
        self._ensure_client()
        result = (
            self.client.table("posts")
            .select("*, user:users(id, name, phone)")
            .eq("neighbourhood_id", neighbourhood_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []
    
    async def update_user_neighbourhood(self, user_id: str, neighbourhood_id: str) -> Dict[str, Any]:
        """Update user's neighbourhood"""
        self._ensure_client()
        result = (
            self.client.table("users")
            .update({"neighbourhood_id": neighbourhood_id})
            .eq("id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None
    
    async def get_user_one_signal_id(self, user_id: str) -> Optional[str]:
        """Get user's OneSignal player ID"""
        user = await self.get_user(user_id)
        return user.get("onesignal_player_id") if user else None
    
    async def update_one_signal_id(self, user_id: str, player_id: str) -> Dict[str, Any]:
        """Update user's OneSignal player ID"""
        self._ensure_client()
        result = (
            self.client.table("users")
            .update({"onesignal_player_id": player_id})
            .eq("id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None
    
    async def get_post(self, post_id: str) -> Optional[Dict[str, Any]]:
        """Get post by ID"""
        self._ensure_client()
        result = self.client.table("posts").select("*").eq("id", post_id).execute()
        return result.data[0] if result.data else None
    
    async def create_comment(self, comment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new comment"""
        self._ensure_client()
        result = self.client.table("comments").insert(comment_data).execute()
        return result.data[0] if result.data else None
    
    async def get_comments_by_post(self, post_id: str) -> List[Dict[str, Any]]:
        """Get all comments for a post"""
        self._ensure_client()
        result = (
            self.client.table("comments")
            .select("*, user:users(id, name, phone)")
            .eq("post_id", post_id)
            .order("created_at", desc=False)
            .execute()
        )
        return result.data or []
    
    async def get_comment(self, comment_id: str) -> Optional[Dict[str, Any]]:
        """Get comment by ID"""
        self._ensure_client()
        result = self.client.table("comments").select("*").eq("id", comment_id).execute()
        return result.data[0] if result.data else None
    
    async def update_comment(self, comment_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a comment"""
        self._ensure_client()
        result = (
            self.client.table("comments")
            .update(update_data)
            .eq("id", comment_id)
            .execute()
        )
        return result.data[0] if result.data else None
    
    async def delete_comment(self, comment_id: str) -> bool:
        """Delete a comment"""
        self._ensure_client()
        result = self.client.table("comments").delete().eq("id", comment_id).execute()
        return True
    
    async def get_neighbourhoods(
        self,
        city: Optional[str] = None,
        province: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get neighbourhoods with optional filtering"""
        self._ensure_client()
        query = self.client.table("neighbourhoods").select("*")
        
        if city:
            query = query.eq("city", city)
        if province:
            query = query.eq("province", province)
        if search:
            query = query.ilike("name", f"%{search}%")
        
        result = query.order("name").limit(limit).execute()
        return result.data or []
    
    async def get_neighbourhood(self, neighbourhood_id: str) -> Optional[Dict[str, Any]]:
        """Get neighbourhood by ID"""
        self._ensure_client()
        result = self.client.table("neighbourhoods").select("*").eq("id", neighbourhood_id).execute()
        return result.data[0] if result.data else None

# Singleton instance
supabase_service = SupabaseService()

