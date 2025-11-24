"""
Storage service for handling file uploads to Supabase Storage
"""
import os
import uuid
from typing import Optional, BinaryIO
from fastapi import UploadFile, HTTPException, status
from supabase import create_client

class StorageService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_service_role_key:
            self.client = None
        else:
            self.client = create_client(self.supabase_url, self.supabase_service_role_key)
        self.bucket_name = "post-images"  # Default bucket for post images
    
    def _ensure_client(self):
        """Ensure Supabase client is initialized"""
        if self.client is None:
            # Reload environment variables in case they were set after module import
            self.supabase_url = os.getenv("SUPABASE_URL")
            self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not self.supabase_url or not self.supabase_service_role_key:
                raise ValueError("Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file")
            self.client = create_client(self.supabase_url, self.supabase_service_role_key)
    
    async def upload_image(
        self,
        file: UploadFile,
        user_id: str,
        folder: str = "posts"
    ) -> str:
        """
        Upload an image file to Supabase Storage
        
        Args:
            file: FastAPI UploadFile object
            user_id: User ID for organizing files
            folder: Folder name (e.g., "posts", "businesses")
            
        Returns:
            Public URL of the uploaded image
            
        Raises:
            HTTPException: If upload fails
        """
        self._ensure_client()
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Validate file size (max 5MB)
        file_content = await file.read()
        file_size = len(file_content)
        max_size = 5 * 1024 * 1024  # 5MB
        
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: 5MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{folder}/{user_id}/{uuid.uuid4()}.{file_extension}"
        
        try:
            # Upload to Supabase Storage
            # Supabase Python client upload method
            # Note: upsert should be a string "false" or omitted
            response = self.client.storage.from_(self.bucket_name).upload(
                path=unique_filename,
                file=file_content,
                file_options={
                    "content-type": file.content_type,
                    "upsert": "false"  # Don't overwrite existing files (must be string)
                }
            )
            
            # Construct public URL manually (Supabase Storage public URL format)
            public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{unique_filename}"
            
            return public_url
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image: {str(e)}"
            )
    
    async def delete_image(self, image_url: str) -> bool:
        """
        Delete an image from Supabase Storage
        
        Args:
            image_url: Public URL of the image to delete
            
        Returns:
            True if deleted successfully
        """
        self._ensure_client()
        
        try:
            # Extract file path from URL
            # Supabase Storage URLs format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
            if "/storage/v1/object/public/" in image_url:
                # Extract path after bucket name
                parts = image_url.split("/storage/v1/object/public/")[1]
                if "/" in parts:
                    # Remove bucket name from path
                    path_parts = parts.split("/", 1)
                    if len(path_parts) > 1:
                        path = path_parts[1]
                    else:
                        return False
                else:
                    return False
            elif f"/{self.bucket_name}/" in image_url:
                # Alternative URL format
                path = image_url.split(f"/{self.bucket_name}/")[1]
            else:
                return False
            
            # Delete file
            self.client.storage.from_(self.bucket_name).remove([path])
            return True
            
        except Exception as e:
            # Log error but don't fail (file might not exist)
            print(f"Error deleting image: {e}")
            return False
    
    def get_public_url(self, file_path: str) -> str:
        """
        Get public URL for a file path
        
        Args:
            file_path: Path to file in storage
            
        Returns:
            Public URL
        """
        self._ensure_client()
        return self.client.storage.from_(self.bucket_name).get_public_url(file_path)

# Singleton instance
storage_service = StorageService()

