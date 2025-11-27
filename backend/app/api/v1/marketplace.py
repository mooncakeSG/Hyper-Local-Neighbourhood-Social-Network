from fastapi import APIRouter, HTTPException, Depends, Header, Query
from typing import Optional, List
from pydantic import BaseModel, validator
from app.services.supabase_service import supabase_service
from app.services.auth_service import auth_service
from app.utils.validators import sanitize_string, validate_url

router = APIRouter()

class MarketplaceItemCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str  # e.g., "electronics", "furniture", "clothing", "other"
    image_url: Optional[str] = None
    condition: Optional[str] = "used"  # "new", "like_new", "used", "fair"
    
    @validator('title')
    def validate_title(cls, v):
        return sanitize_string(v, max_length=255)
    
    @validator('description')
    def validate_description(cls, v):
        return sanitize_string(v, max_length=5000)
    
    @validator('price')
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("Price must be non-negative")
        if v > 10000000:  # 10 million
            raise ValueError("Price too high")
        return v
    
    @validator('condition')
    def validate_condition(cls, v):
        if v not in ['new', 'like_new', 'used', 'fair']:
            raise ValueError("Condition must be one of: new, like_new, used, fair")
        return v
    
    @validator('image_url')
    def validate_image_url(cls, v):
        if v:
            return validate_url(v)
        return v

class MarketplaceItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    condition: Optional[str] = None
    status: Optional[str] = None  # "available", "sold", "pending"

class MarketplaceItemResponse(BaseModel):
    id: str
    user_id: str
    neighbourhood_id: str
    title: str
    description: str
    price: float
    category: str
    condition: str
    status: str
    image_url: Optional[str]
    created_at: str
    updated_at: str
    user: Optional[dict] = None  # Include user details

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify user ID from authorization header"""
    return await auth_service.get_user_id_from_token(authorization)

@router.post("/", response_model=MarketplaceItemResponse)
async def create_marketplace_item(
    item: MarketplaceItemCreate,
    user_id: str = Depends(get_user_id)
):
    """Create a new marketplace item"""
    try:
        # Get user to get neighbourhood_id
        user = await supabase_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get("neighbourhood_id"):
            raise HTTPException(status_code=400, detail="User has no neighbourhood selected")
        
        # Create marketplace item
        item_data = {
            "user_id": user_id,
            "neighbourhood_id": user["neighbourhood_id"],
            "title": item.title,
            "description": item.description,
            "price": item.price,
            "category": item.category,
            "condition": item.condition or "used",
            "status": "available",
            "image_url": item.image_url,
        }
        
        created_item = await supabase_service.create_marketplace_item(item_data)
        return created_item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[MarketplaceItemResponse])
async def get_marketplace_items(
    neighbourhood_id: Optional[str] = Query(None, description="Filter by neighbourhood"),
    user_id: Optional[str] = Query(None, description="Filter by user"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query("available", description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Get marketplace items with optional filters"""
    try:
        items = await supabase_service.get_marketplace_items(
            neighbourhood_id=neighbourhood_id,
            user_id=user_id,
            category=category,
            status=status,
            limit=limit,
            offset=offset
        )
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{item_id}", response_model=MarketplaceItemResponse)
async def get_marketplace_item(item_id: str):
    """Get a single marketplace item by ID"""
    try:
        item = await supabase_service.get_marketplace_item_by_id(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Marketplace item not found")
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{item_id}", response_model=MarketplaceItemResponse)
async def update_marketplace_item(
    item_id: str,
    item_update: MarketplaceItemUpdate,
    user_id: str = Depends(get_user_id)
):
    """Update a marketplace item (only by owner)"""
    try:
        # Check if user owns the item
        existing_item = await supabase_service.get_marketplace_item_by_id(item_id)
        if not existing_item:
            raise HTTPException(status_code=404, detail="Marketplace item not found")
        
        if existing_item.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this item")
        
        # Update item
        update_data = item_update.dict(exclude_unset=True)
        updated_item = await supabase_service.update_marketplace_item(item_id, update_data)
        
        if not updated_item:
            raise HTTPException(status_code=404, detail="Item not found or no changes made")
        
        return updated_item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{item_id}", status_code=204)
async def delete_marketplace_item(
    item_id: str,
    user_id: str = Depends(get_user_id)
):
    """Delete a marketplace item (only by owner)"""
    try:
        # Check if user owns the item
        existing_item = await supabase_service.get_marketplace_item_by_id(item_id)
        if not existing_item:
            raise HTTPException(status_code=404, detail="Marketplace item not found")
        
        if existing_item.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this item")
        
        await supabase_service.delete_marketplace_item(item_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=List[MarketplaceItemResponse])
async def search_marketplace_items(
    q: str = Query(..., description="Search query"),
    neighbourhood_id: Optional[str] = Query(None, description="Filter by neighbourhood"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    """Search marketplace items by title and description"""
    try:
        items = await supabase_service.search_marketplace_items(
            query=q,
            neighbourhood_id=neighbourhood_id,
            category=category,
            min_price=min_price,
            max_price=max_price,
            limit=limit
        )
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

