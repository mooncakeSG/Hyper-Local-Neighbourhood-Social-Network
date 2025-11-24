"""
Error Handling Middleware
"""
import logging
import traceback
import uuid
from typing import Callable
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.utils.errors import create_error_response, ErrorCodes

# Set up logging
# Configure logging with a format that handles missing request_id
# Use a custom formatter that safely handles request_id
import logging

class SafeFormatter(logging.Formatter):
    def format(self, record):
        # Ensure request_id exists in record
        if not hasattr(record, 'request_id'):
            record.request_id = getattr(record, 'request_id', 'unknown')
        return super().format(record)

# Set up basic config without request_id in format to avoid KeyError
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        try:
            response = await call_next(request)
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            return response
        except HTTPException as e:
            # Handle HTTP exceptions with standardized format
            logger.warning(
                f"HTTP {e.status_code}: {e.detail}",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "status_code": e.status_code
                }
            )
            
            # Create standardized error response
            error_code = self._get_error_code(e.status_code)
            return create_error_response(
                status_code=e.status_code,
                detail=e.detail,
                error_code=error_code,
                request_id=request_id
            )
        except Exception as e:
            # Log unexpected errors
            logger.error(
                f"Unhandled exception: {str(e)}",
                exc_info=True,
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "client": request.client.host if request.client else "unknown"
                }
            )
            
            # Return standardized error response
            return create_error_response(
                status_code=500,
                detail="Internal server error",
                error_code=ErrorCodes.INTERNAL_ERROR,
                request_id=request_id,
                metadata={"error_type": type(e).__name__}
            )
    
    def _get_error_code(self, status_code: int) -> str:
        """Get error code from status code"""
        error_codes = {
            400: ErrorCodes.VALIDATION_ERROR,
            401: ErrorCodes.AUTHENTICATION_ERROR,
            403: ErrorCodes.AUTHORIZATION_ERROR,
            404: ErrorCodes.NOT_FOUND,
            429: ErrorCodes.RATE_LIMIT_EXCEEDED,
            500: ErrorCodes.INTERNAL_ERROR,
            503: ErrorCodes.EXTERNAL_SERVICE_ERROR,
        }
        return error_codes.get(status_code, f"ERR_{status_code}")

