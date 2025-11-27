from fastapi import APIRouter, HTTPException, Depends, Header, Query
from typing import Optional, List
from pydantic import BaseModel, validator
from app.services.supabase_service import supabase_service
from app.services.auth_service import auth_service
from app.utils.validators import sanitize_string, validate_phone, validate_email, validate_url

router = APIRouter()

class BusinessCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str  # e.g., "restaurant", "retail", "service", "other"
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        return sanitize_string(v, max_length=255)
    
    @validator('description')
    def validate_description(cls, v):
        if v:
            return sanitize_string(v, max_length=5000)
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            return validate_phone(v)
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v:
            return validate_email(v)
        return v
    
    @validator('website', 'image_url')
    def validate_urls(cls, v):
        if v:
            return validate_url(v)
        return v

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None

class BusinessResponse(BaseModel):
    id: str
    user_id: str
    neighbourhood_id: str
    name: str
    description: Optional[str]
    category: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    website: Optional[str]
    address: Optional[str]
    image_url: Optional[str]
    created_at: str
    updated_at: str
    user: Optional[dict] = None  # Include user details

async def get_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify user ID from authorization header"""
    return await auth_service.get_user_id_from_token(authorization)

@router.post("/", response_model=BusinessResponse)
async def create_business(
    business: BusinessCreate,
    user_id: str = Depends(get_user_id)
):
    """Create a new business listing"""
    try:
        # Get user to get neighbourhood_id
        user = await supabase_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get("neighbourhood_id"):
            raise HTTPException(status_code=400, detail="User has no neighbourhood selected")
        
        # Create business listing
        business_data = {
            "user_id": user_id,
            "neighbourhood_id": user["neighbourhood_id"],
            "name": business.name,
            "description": business.description,
            "category": business.category,
            "phone": business.phone,
            "email": business.email,
            "website": business.website,
            "address": business.address,
            "image_url": business.image_url,
        }
        
        created_business = await supabase_service.create_business(business_data)
        return created_business
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[BusinessResponse])
async def get_businesses(
    neighbourhood_id: Optional[str] = Query(None, description="Filter by neighbourhood"),
    user_id: Optional[str] = Query(None, description="Filter by user"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Get business listings with optional filters"""
    try:
        businesses = await supabase_service.get_businesses(
            neighbourhood_id=neighbourhood_id,
            user_id=user_id,
            category=category,
            limit=limit,
            offset=offset
        )
        return businesses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business_by_id(business_id: str):
    """Get a single business listing by ID"""
    try:
        business = await supabase_service.get_business_by_id(business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Business not found")
        return business
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: str,
    business_update: BusinessUpdate,
    user_id: str = Depends(get_user_id)
):
    """Update a business listing (only by owner)"""
    try:
        # Check if user owns the business
        existing_business = await supabase_service.get_business_by_id(business_id)
        if not existing_business:
            raise HTTPException(status_code=404, detail="Business not found")
        
        if existing_business.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this business")
        
        # Update business
        update_data = business_update.dict(exclude_unset=True)
        updated_business = await supabase_service.update_business(business_id, update_data)
        
        if not updated_business:
            raise HTTPException(status_code=404, detail="Business not found or no changes made")
        
        return updated_business
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{business_id}", status_code=204)
async def delete_business(
    business_id: str,
    user_id: str = Depends(get_user_id)
):
    """Delete a business listing (only by owner)"""
    try:
        # Check if user owns the business
        existing_business = await supabase_service.get_business_by_id(business_id)
        if not existing_business:
            raise HTTPException(status_code=404, detail="Business not found")
        
        if existing_business.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this business")
        
        await supabase_service.delete_business(business_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=List[BusinessResponse])
async def search_businesses(
    q: str = Query(..., description="Search query"),
    neighbourhood_id: Optional[str] = Query(None, description="Filter by neighbourhood"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200)
):
    """Search business listings by name and description"""
    try:
        businesses = await supabase_service.search_businesses(
            query=q,
            neighbourhood_id=neighbourhood_id,
            category=category,
            limit=limit
        )
        return businesses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

