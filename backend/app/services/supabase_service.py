import os
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

class SupabaseService:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        self.url = os.getenv("SUPABASE_URL")
        self.service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.url or not self.service_role_key:
            # Don't raise error at init - allow lazy initialization
            self.client = None
        else:
            self.client: Client = create_client(self.url, self.service_role_key)
    
    def _ensure_client(self):
        """Ensure client is initialized and re-load env vars if needed"""
        if self.client is None:
            # Reload environment variables in case they were set after module import
            load_dotenv()
            self.url = os.getenv("SUPABASE_URL")
            self.service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
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
    
    async def get_posts_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get posts by a specific user"""
        self._ensure_client()
        result = (
            self.client.table("posts")
            .select("*, user:users(id, name, phone, avatar_url)")
            .eq("user_id", user_id)
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
    
    async def get_post_like(self, post_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific like (check if user liked a post)"""
        self._ensure_client()
        result = (
            self.client.table("post_likes")
            .select("*")
            .eq("post_id", post_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None
    
    async def create_post_like(self, post_id: str, user_id: str) -> Dict[str, Any]:
        """Create a like for a post"""
        self._ensure_client()
        result = (
            self.client.table("post_likes")
            .insert({"post_id": post_id, "user_id": user_id})
            .execute()
        )
        return result.data[0] if result.data else None
    
    async def delete_post_like(self, post_id: str, user_id: str) -> bool:
        """Delete a like for a post"""
        self._ensure_client()
        result = (
            self.client.table("post_likes")
            .delete()
            .eq("post_id", post_id)
            .eq("user_id", user_id)
            .execute()
        )
        return True
    
    async def get_post_likes_count(self, post_id: str) -> int:
        """Get the count of likes for a post"""
        self._ensure_client()
        result = (
            self.client.table("post_likes")
            .select("id", count="exact")
            .eq("post_id", post_id)
            .execute()
        )
        return result.count if result.count is not None else 0
    
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

    async def create_marketplace_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new marketplace item"""
        self._ensure_client()
        result = self.client.table("marketplace_items").insert(item_data).execute()
        return result.data[0] if result.data else None

    async def get_marketplace_items(
        self,
        neighbourhood_id: Optional[str] = None,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        status: str = "available",
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get marketplace items with filters"""
        self._ensure_client()
        query = (
            self.client.table("marketplace_items")
            .select("*, user:users(id, name, phone, avatar_url)")
            .eq("status", status)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        
        if neighbourhood_id:
            query = query.eq("neighbourhood_id", neighbourhood_id)
        if user_id:
            query = query.eq("user_id", user_id)
        if category:
            query = query.eq("category", category)
        
        result = query.execute()
        return result.data or []

    async def get_marketplace_item_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Get a marketplace item by ID"""
        self._ensure_client()
        result = (
            self.client.table("marketplace_items")
            .select("*, user:users(id, name, phone)")
            .eq("id", item_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    async def update_marketplace_item(self, item_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a marketplace item"""
        self._ensure_client()
        result = (
            self.client.table("marketplace_items")
            .update(update_data)
            .eq("id", item_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete_marketplace_item(self, item_id: str) -> None:
        """Delete a marketplace item"""
        self._ensure_client()
        self.client.table("marketplace_items").delete().eq("id", item_id).execute()

    async def search_marketplace_items(
        self,
        query: str,
        neighbourhood_id: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search marketplace items by title and description"""
        self._ensure_client()
        search_query = (
            self.client.table("marketplace_items")
            .select("*, user:users(id, name, phone)")
            .or_(f"title.ilike.%{query}%,description.ilike.%{query}%")
            .eq("status", "available")
            .order("created_at", desc=True)
            .limit(limit)
        )
        
        if neighbourhood_id:
            search_query = search_query.eq("neighbourhood_id", neighbourhood_id)
        if category:
            search_query = search_query.eq("category", category)
        if min_price is not None:
            search_query = search_query.gte("price", min_price)
        if max_price is not None:
            search_query = search_query.lte("price", max_price)
        
        result = search_query.execute()
        return result.data or []

    async def create_business(self, business_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new business listing"""
        self._ensure_client()
        result = self.client.table("businesses").insert(business_data).execute()
        return result.data[0] if result.data else None

    async def get_businesses(
        self,
        neighbourhood_id: Optional[str] = None,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get business listings with filters"""
        self._ensure_client()
        query = (
            self.client.table("businesses")
            .select("*, user:users(id, name, phone, avatar_url)")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        
        if neighbourhood_id:
            query = query.eq("neighbourhood_id", neighbourhood_id)
        if user_id:
            query = query.eq("user_id", user_id)
        if category:
            query = query.eq("category", category)
        
        result = query.execute()
        return result.data or []

    async def get_business_by_id(self, business_id: str) -> Optional[Dict[str, Any]]:
        """Get a business listing by ID"""
        self._ensure_client()
        result = (
            self.client.table("businesses")
            .select("*, user:users(id, name, phone)")
            .eq("id", business_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    async def update_business(self, business_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a business listing"""
        self._ensure_client()
        result = (
            self.client.table("businesses")
            .update(update_data)
            .eq("id", business_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete_business(self, business_id: str) -> None:
        """Delete a business listing"""
        self._ensure_client()
        self.client.table("businesses").delete().eq("id", business_id).execute()

    async def search_businesses(
        self,
        query: str,
        neighbourhood_id: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search business listings by name and description"""
        self._ensure_client()
        search_query = (
            self.client.table("businesses")
            .select("*, user:users(id, name, phone)")
            .or_(f"name.ilike.%{query}%,description.ilike.%{query}%")
            .order("created_at", desc=True)
            .limit(limit)
        )
        
        if neighbourhood_id:
            search_query = search_query.eq("neighbourhood_id", neighbourhood_id)
        if category:
            search_query = search_query.eq("category", category)
        
        result = search_query.execute()
        return result.data or []
    
    async def search_users_in_neighbourhood(
        self, 
        neighbourhood_id: str, 
        query: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search users in a neighbourhood by name or email"""
        self._ensure_client()
        query_lower = query.lower().strip()
        
        # Search by name or email (case-insensitive)
        result = (
            self.client.table("users")
            .select("id, name, email, phone")
            .eq("neighbourhood_id", neighbourhood_id)
            .or_(f"name.ilike.%{query_lower}%,email.ilike.%{query_lower}%")
            .limit(limit)
            .execute()
        )
        return result.data or []
    
    async def create_post_mention(self, post_id: str, mentioned_user_id: str) -> Optional[Dict[str, Any]]:
        """Create a mention for a post"""
        self._ensure_client()
        try:
            result = (
                self.client.table("post_mentions")
                .insert({
                    "post_id": post_id,
                    "mentioned_user_id": mentioned_user_id
                })
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            # Ignore duplicate mention errors
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                return None
            raise
    
    async def get_post_mentions(self, post_id: str) -> List[Dict[str, Any]]:
        """Get all mentions for a post"""
        self._ensure_client()
        result = (
            self.client.table("post_mentions")
            .select("*, mentioned_user:users!mentioned_user_id(id, name, email)")
            .eq("post_id", post_id)
            .execute()
        )
        return result.data or []
    
    async def get_user_activity_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user activity statistics (posts, comments, marketplace items, businesses)"""
        self._ensure_client()
        
        # Get post count
        posts_result = (
            self.client.table("posts")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        posts_count = posts_result.count if hasattr(posts_result, 'count') and posts_result.count is not None else len(posts_result.data) if posts_result.data else 0
        
        # Get comment count
        comments_result = (
            self.client.table("comments")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        comments_count = comments_result.count if hasattr(comments_result, 'count') and comments_result.count is not None else len(comments_result.data) if comments_result.data else 0
        
        # Get marketplace items count
        marketplace_result = (
            self.client.table("marketplace_items")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        marketplace_count = marketplace_result.count if hasattr(marketplace_result, 'count') and marketplace_result.count is not None else len(marketplace_result.data) if marketplace_result.data else 0
        
        # Get businesses count
        businesses_result = (
            self.client.table("businesses")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        businesses_count = businesses_result.count if hasattr(businesses_result, 'count') and businesses_result.count is not None else len(businesses_result.data) if businesses_result.data else 0
        
        return {
            "posts_count": posts_count,
            "comments_count": comments_count,
            "marketplace_items_count": marketplace_count,
            "businesses_count": businesses_count
        }

# Singleton instance
supabase_service = SupabaseService()

