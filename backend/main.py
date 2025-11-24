import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.v1 import posts, users, notifications, comments, neighbourhoods

load_dotenv()

app = FastAPI(title="Neighbourhood Social Network API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(posts.router, prefix="/api/v1/posts", tags=["posts"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(comments.router, prefix="/api/v1/comments", tags=["comments"])
app.include_router(neighbourhoods.router, prefix="/api/v1/neighbourhoods", tags=["neighbourhoods"])

@app.get("/")
async def root():
    return {"message": "Neighbourhood Social Network API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

