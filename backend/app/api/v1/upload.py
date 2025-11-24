from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Header, Query
from fastapi.responses import JSONResponse
from typing import Optional
from app.services.storage_service import storage_service
from app.services.auth_service import auth_service

router = APIRouter()

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify user ID from authorization header"""
    return await auth_service.get_user_id_from_token(authorization)

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: Optional[str] = Query(None, description="Folder name (default: 'posts')"),
    user_id: str = Depends(get_user_id)
):
    """
    Upload an image file to Supabase Storage
    
    - **file**: Image file (JPEG, PNG, WebP, GIF)
    - **folder**: Optional folder name as query parameter (default: "posts")
    - **user_id**: Automatically extracted from auth token
    
    Returns the public URL of the uploaded image.
    """
    try:
        folder = folder or "posts"
        image_url = await storage_service.upload_image(file, user_id, folder)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "url": image_url,
                "message": "Image uploaded successfully"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.delete("/image")
async def delete_image(
    image_url: str,
    user_id: str = Depends(get_user_id)
):
    """
    Delete an image from Supabase Storage
    
    - **image_url**: Public URL of the image to delete
    - **user_id**: Automatically extracted from auth token
    
    Note: In production, you may want to verify the user owns the image.
    """
    try:
        deleted = await storage_service.delete_image(image_url)
        
        if deleted:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "success": True,
                    "message": "Image deleted successfully"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found or could not be deleted"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )

