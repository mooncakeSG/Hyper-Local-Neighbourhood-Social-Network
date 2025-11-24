from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
from pydantic import BaseModel
from app.services.supabase_service import supabase_service

router = APIRouter()

class CommentCreate(BaseModel):
    post_id: str
    content: str

class CommentUpdate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    post_id: str
    user_id: str
    content: str
    created_at: str
    updated_at: str

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

@router.post("/", response_model=CommentResponse)
async def create_comment(
    comment: CommentCreate,
    user_id: str = Depends(get_user_id)
):
    """Create a new comment on a post"""
    try:
        if not comment.content.strip():
            raise HTTPException(status_code=400, detail="Comment content cannot be empty")
        
        # Verify post exists and user has access (in same neighbourhood)
        post = await supabase_service.get_post(comment.post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Verify user is in the same neighbourhood as the post
        user = await supabase_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.get("neighbourhood_id") != post.get("neighbourhood_id"):
            raise HTTPException(status_code=403, detail="You can only comment on posts in your neighbourhood")
        
        # Create comment
        comment_data = {
            "post_id": comment.post_id,
            "user_id": user_id,
            "content": comment.content.strip(),
        }
        
        created_comment = await supabase_service.create_comment(comment_data)
        return created_comment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/post/{post_id}", response_model=List[CommentResponse])
async def get_comments_by_post(post_id: str):
    """Get all comments for a specific post"""
    try:
        comments = await supabase_service.get_comments_by_post(post_id)
        return comments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(comment_id: str):
    """Get a specific comment by ID"""
    try:
        comment = await supabase_service.get_comment(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        return comment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    comment_update: CommentUpdate,
    user_id: str = Depends(get_user_id)
):
    """Update a comment (only by the author)"""
    try:
        if not comment_update.content.strip():
            raise HTTPException(status_code=400, detail="Comment content cannot be empty")
        
        # Verify comment exists and belongs to user
        comment = await supabase_service.get_comment(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        if comment.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You can only update your own comments")
        
        # Update comment
        updated_comment = await supabase_service.update_comment(
            comment_id, 
            {"content": comment_update.content.strip()}
        )
        return updated_comment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    user_id: str = Depends(get_user_id)
):
    """Delete a comment (only by the author)"""
    try:
        # Verify comment exists and belongs to user
        comment = await supabase_service.get_comment(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        if comment.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own comments")
        
        # Delete comment
        await supabase_service.delete_comment(comment_id)
        return {"message": "Comment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

