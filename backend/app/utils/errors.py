"""
Standardized error responses
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
import uuid

class APIError(HTTPException):
    """Custom API error with standardized format"""
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        error_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code or f"ERR_{status_code}"
        self.error_type = error_type or self._get_error_type(status_code)
        self.metadata = metadata or {}
    
    def _get_error_type(self, status_code: int) -> str:
        """Get error type from status code"""
        if 400 <= status_code < 500:
            return "client_error"
        elif 500 <= status_code < 600:
            return "server_error"
        else:
            return "unknown_error"
    
    def to_dict(self, request_id: Optional[str] = None) -> Dict[str, Any]:
        """Convert error to dictionary"""
        return {
            "error": {
                "code": self.error_code,
                "type": self.error_type,
                "message": self.detail,
                "request_id": request_id,
                **self.metadata
            }
        }

def create_error_response(
    status_code: int,
    detail: str,
    error_code: Optional[str] = None,
    request_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """Create standardized error response"""
    error = APIError(status_code, detail, error_code, metadata=metadata)
    return JSONResponse(
        status_code=status_code,
        content=error.to_dict(request_id)
    )

# Common error codes
class ErrorCodes:
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"

