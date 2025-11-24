"""
Request Logging Middleware
"""
import time
import logging
from typing import Callable
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timer
        start_time = time.time()
        
        # Get request ID (set by error handler middleware)
        request_id = getattr(request.state, "request_id", "unknown")
        
        # Log request
        client_ip = request.client.host if request.client else "unknown"
        logger.info(
            f"{request.method} {request.url.path} - Client: {client_ip}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client": client_ip,
                "query_params": str(request.query_params),
                "user_agent": request.headers.get("user-agent", "unknown")
            }
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(
            log_level,
            f"{request.method} {request.url.path} - Status: {response.status_code} - Duration: {duration:.3f}s",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration": duration
            }
        )
        
        # Add timing header
        response.headers["X-Process-Time"] = f"{duration:.3f}"
        
        return response

