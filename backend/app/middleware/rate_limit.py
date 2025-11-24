"""
Rate Limiting Middleware
"""
import time
from collections import defaultdict
from typing import Callable
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.utils.errors import create_error_response, ErrorCodes

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
        self.cleanup_interval = 60  # Clean up old entries every 60 seconds
        self.last_cleanup = time.time()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Clean up old entries periodically
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries(current_time)
            self.last_cleanup = current_time
        
        # Get client identifier (IP address or user ID from token)
        client_id = self._get_client_id(request)
        
        # Get request ID
        request_id = getattr(request.state, "request_id", "unknown")
        
        # Check rate limit
        if self._is_rate_limited(client_id, current_time):
            # Log rate limit violation
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                f"Rate limit exceeded for {client_id}",
                extra={
                    "request_id": request_id,
                    "client": client_id,
                    "path": request.url.path
                }
            )
            
            # Return standardized error response
            response = create_error_response(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                error_code=ErrorCodes.RATE_LIMIT_EXCEEDED,
                request_id=request_id
            )
            response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
            response.headers["X-RateLimit-Retry-After"] = "60"
            return response
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self._get_remaining_requests(client_id, current_time)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(current_time + 60))
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request"""
        # Try to get user ID from authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            # In production, extract user ID from JWT
            # For now, use IP address
            pass
        
        # Fallback to IP address
        client_ip = request.client.host if request.client else "unknown"
        return client_ip
    
    def _is_rate_limited(self, client_id: str, current_time: float) -> bool:
        """Check if client has exceeded rate limit"""
        # Remove requests older than 1 minute
        cutoff_time = current_time - 60
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > cutoff_time
        ]
        
        # Check if limit exceeded
        if len(self.requests[client_id]) >= self.requests_per_minute:
            return True
        
        # Record this request
        self.requests[client_id].append(current_time)
        return False
    
    def _get_remaining_requests(self, client_id: str, current_time: float) -> int:
        """Get remaining requests for client"""
        cutoff_time = current_time - 60
        recent_requests = [
            req_time for req_time in self.requests.get(client_id, [])
            if req_time > cutoff_time
        ]
        return max(0, self.requests_per_minute - len(recent_requests))
    
    def _cleanup_old_entries(self, current_time: float):
        """Remove old entries to prevent memory leaks"""
        cutoff_time = current_time - 120  # Remove entries older than 2 minutes
        for client_id in list(self.requests.keys()):
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id]
                if req_time > cutoff_time
            ]
            if not self.requests[client_id]:
                del self.requests[client_id]

