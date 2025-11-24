"""
Supabase Auth Client for authentication operations
Uses anon key for client-side auth operations
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

class AuthClient:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        self.url = os.getenv("SUPABASE_URL")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")
        self.client: Client = None
        
        if self.url and self.anon_key:
            # Use anon key for auth operations (client-side auth)
            self.client = create_client(self.url, self.anon_key)
    
    def _ensure_client(self):
        """Ensure client is initialized"""
        if self.client is None:
            load_dotenv()
            self.url = os.getenv("SUPABASE_URL")
            self.anon_key = os.getenv("SUPABASE_ANON_KEY")
            
            if not self.url or not self.anon_key:
                raise ValueError("Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
            
            self.client = create_client(self.url, self.anon_key)
    
    def get_client(self) -> Client:
        """Get the Supabase client"""
        self._ensure_client()
        return self.client

# Singleton instance
auth_client = AuthClient()

