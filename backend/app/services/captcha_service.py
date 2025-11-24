"""
hCaptcha verification service
"""
import os
import httpx
from typing import Optional
from fastapi import HTTPException, status
from dotenv import load_dotenv

class CaptchaService:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        self.secret_key = os.getenv("HCAPTCHA_SECRET_KEY")
        self.verify_url = "https://hcaptcha.com/siteverify"
    
    def _ensure_config(self):
        """Ensure hCaptcha is configured"""
        # Reload env vars in case they were set after module import
        load_dotenv()
        if not self.secret_key:
            self.secret_key = os.getenv("HCAPTCHA_SECRET_KEY")
        if not self.secret_key:
            raise ValueError("Missing hCaptcha secret key. Please set HCAPTCHA_SECRET_KEY in your .env file")
    
    async def verify(self, captcha_token: str, user_ip: Optional[str] = None) -> bool:
        """
        Verify hCaptcha token
        
        Args:
            captcha_token: The hCaptcha response token from the frontend
            user_ip: Optional user IP address for additional verification
            
        Returns:
            True if verification successful, False otherwise
            
        Raises:
            HTTPException: If verification fails or service error
        """
        self._ensure_config()
        
        if not captcha_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="hCaptcha token is required"
            )
        
        # Allow test tokens in development mode
        dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
        if dev_mode and captcha_token == "test_token":
            # Skip verification in dev mode with test token
            import logging
            logger = logging.getLogger(__name__)
            logger.info("Dev mode: Bypassing hCaptcha verification with test_token")
            return True
        
        try:
            # Prepare verification request
            data = {
                "secret": self.secret_key,
                "response": captcha_token
            }
            
            if user_ip:
                data["remoteip"] = user_ip
            
            # Verify with hCaptcha
            import logging
            logger = logging.getLogger(__name__)
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    response = await client.post(
                        self.verify_url,
                        data=data
                    )
                    
                    # Log response for debugging
                    logger.info(f"hCaptcha API response status: {response.status_code}")
                    
                    response.raise_for_status()
                    
                    # Parse JSON response
                    try:
                        result = response.json()
                        logger.info(f"hCaptcha API response: {result}")
                    except Exception as json_error:
                        logger.error(f"Failed to parse hCaptcha JSON response: {json_error}")
                        logger.error(f"Response text: {response.text[:200]}")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to parse hCaptcha response"
                        )
                    
                    # Check verification result
                    if result.get("success"):
                        return True
                    else:
                        error_codes = result.get("error-codes", [])
                        error_message = ", ".join(error_codes) if error_codes else "Verification failed"
                        
                        logger.warning(f"hCaptcha verification failed: {error_message}, error codes: {error_codes}")
                        
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"hCaptcha verification failed: {error_message}"
                        )
                except HTTPException:
                    # Re-raise HTTP exceptions
                    raise
                except httpx.HTTPStatusError as e:
                    # Handle HTTP errors
                    logger.error(f"hCaptcha HTTP error: {e.response.status_code} - {e.response.text[:200]}")
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"hCaptcha service error: {e.response.status_code}"
                    )
                except Exception as api_error:
                    # Catch any other errors during API call
                    logger.error(f"hCaptcha API call error: {str(api_error)}", exc_info=True)
                    raise
                
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="hCaptcha service timeout. Please try again."
            )
        except httpx.HTTPStatusError as e:
            # Handle HTTP errors from hCaptcha API
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"hCaptcha service error: {e.response.status_code}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"hCaptcha service connection error: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            # Log the full error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"hCaptcha verification error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Captcha verification process failed: {str(e)}"
            )

# Singleton instance - will be created when module is imported
# Environment variables are loaded in __init__ and _ensure_config
captcha_service = CaptchaService()

