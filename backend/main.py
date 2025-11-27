import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.v1 import posts, users, notifications, comments, neighbourhoods, upload, marketplace, businesses, auth, likes

# Import middleware
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.request_logger import RequestLoggerMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

load_dotenv()

app = FastAPI(
    title="Neighbourhood Social Network API",
    version="1.0.0",
    description="Hyper-local social network API for South African neighbourhoods"
)

# Add middleware (order matters - first added is outermost)
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RequestLoggerMiddleware)

# Rate limiting (configurable via environment)
rate_limit_enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
if rate_limit_enabled:
    requests_per_minute = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    app.add_middleware(RateLimitMiddleware, requests_per_minute=requests_per_minute)

# CORS middleware
# Get allowed origins from environment or default to wildcard for dev
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")
if allowed_origins == ["*"] and os.getenv("ENVIRONMENT") == "production":
    # In production, require explicit CORS configuration
    allowed_origins = []  # Will fail if not configured
    print("WARNING: CORS_ORIGINS not set in production!")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(posts.router, prefix="/api/v1/posts", tags=["posts"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(comments.router, prefix="/api/v1/comments", tags=["comments"])
app.include_router(neighbourhoods.router, prefix="/api/v1/neighbourhoods", tags=["neighbourhoods"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["marketplace"])
app.include_router(businesses.router, prefix="/api/v1/businesses", tags=["businesses"])
app.include_router(likes.router, prefix="/api/v1", tags=["likes"])

from app.api.v1 import health as health_api

# Include health check router
app.include_router(health_api.router, prefix="/health", tags=["health"])

@app.get("/")
async def root():
    return {"message": "Neighbourhood Social Network API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

