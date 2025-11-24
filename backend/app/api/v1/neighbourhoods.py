from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from app.services.supabase_service import supabase_service

router = APIRouter()

class NeighbourhoodResponse(BaseModel):
    id: str
    name: str
    city: Optional[str]
    province: Optional[str]
    country: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: str

@router.get("/", response_model=List[NeighbourhoodResponse])
async def get_neighbourhoods(
    city: Optional[str] = Query(None, description="Filter by city"),
    province: Optional[str] = Query(None, description="Filter by province"),
    search: Optional[str] = Query(None, description="Search by name"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results")
):
    """Get all neighbourhoods with optional filtering"""
    try:
        neighbourhoods = await supabase_service.get_neighbourhoods(
            city=city,
            province=province,
            search=search,
            limit=limit
        )
        return neighbourhoods
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{neighbourhood_id}", response_model=NeighbourhoodResponse)
async def get_neighbourhood(neighbourhood_id: str):
    """Get a specific neighbourhood by ID"""
    try:
        neighbourhood = await supabase_service.get_neighbourhood(neighbourhood_id)
        if not neighbourhood:
            raise HTTPException(status_code=404, detail="Neighbourhood not found")
        return neighbourhood
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

