"""
Enhanced health check and monitoring endpoints
"""
from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.services.supabase_service import supabase_service
from app.services.onesignal_service import onesignal_service
from app.services.storage_service import storage_service

router = APIRouter()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "neighbourhood-social-network-api",
        "version": "1.0.0"
    }

@router.get("/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check with service status"""
    health_status = {
        "status": "healthy",
        "service": "neighbourhood-social-network-api",
        "version": "1.0.0",
        "services": {}
    }
    
    # Check Supabase
    try:
        supabase_service._ensure_client()
        health_status["services"]["supabase"] = {
            "status": "healthy",
            "connected": supabase_service.client is not None
        }
    except Exception as e:
        health_status["services"]["supabase"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check Storage
    try:
        storage_service._ensure_client()
        health_status["services"]["storage"] = {
            "status": "healthy",
            "bucket": storage_service.bucket_name,
            "connected": storage_service.client is not None
        }
    except Exception as e:
        health_status["services"]["storage"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check OneSignal
    try:
        onesignal_service._ensure_config()
        health_status["services"]["onesignal"] = {
            "status": "healthy",
            "configured": True
        }
    except Exception as e:
        health_status["services"]["onesignal"] = {
            "status": "unhealthy",
            "error": str(e),
            "note": "OneSignal is optional"
        }
        # Don't mark as degraded if OneSignal fails (it's optional)
    
    return health_status

@router.get("/metrics")
async def metrics() -> Dict[str, Any]:
    """Basic metrics endpoint"""
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    
    return {
        "cpu_percent": process.cpu_percent(interval=0.1),
        "memory_mb": process.memory_info().rss / 1024 / 1024,
        "threads": process.num_threads(),
        "open_files": len(process.open_files()),
    }

