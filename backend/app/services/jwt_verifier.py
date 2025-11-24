"""
JWT Token Verifier with Supabase Public Key
Production-ready JWT verification
"""
import os
import jwt
import httpx
import time
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

class JWTVerifier:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.public_key: Optional[rsa.RSAPublicKey] = None
        self.jwks_cache: Optional[Dict] = None
        self.cache_expiry: Optional[float] = None
    
    async def get_public_key(self) -> rsa.RSAPublicKey:
        """
        Fetch Supabase public key from JWKS endpoint
        Caches the key for performance
        """
        import time
        
        # Check cache (refresh every hour)
        if self.public_key and self.cache_expiry and time.time() < self.cache_expiry:
            return self.public_key
        
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL not configured")
        
        try:
            # Fetch JWKS from Supabase
            jwks_url = f"{self.supabase_url}/.well-known/jwks.json"
            async with httpx.AsyncClient() as client:
                response = await client.get(jwks_url, timeout=10.0)
                response.raise_for_status()
                jwks = response.json()
            
            # Extract public key from JWKS
            if not jwks.get("keys"):
                raise ValueError("No keys found in JWKS")
            
            # Use the first key (Supabase typically has one)
            key_data = jwks["keys"][0]
            
            # Convert JWK to RSA public key
            if key_data.get("kty") != "RSA":
                raise ValueError("Only RSA keys are supported")
            
            # Construct RSA public key from JWK
            # Use PyJWT's base64url_decode utility
            n_bytes = jwt.utils.base64url_decode(key_data["n"])
            e_bytes = jwt.utils.base64url_decode(key_data["e"])
            
            n = int.from_bytes(n_bytes, byteorder="big")
            e = int.from_bytes(e_bytes, byteorder="big")
            
            public_key = rsa.RSAPublicNumbers(e, n).public_key(default_backend())
            
            # Cache the key
            self.public_key = public_key
            self.cache_expiry = time.time() + 3600  # Cache for 1 hour
            
            return public_key
            
        except Exception as e:
            raise ValueError(f"Failed to fetch public key: {str(e)}")
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify a Supabase JWT token with signature verification
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token is invalid
        """
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization token"
            )
        
        try:
            # Get public key
            public_key = await self.get_public_key()
            
            # Verify token with public key
            decoded_token = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "require_exp": True,
                    "require_iat": True
                }
            )
            
            # Validate required claims
            if not decoded_token.get("sub"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing user ID"
                )
            
            return decoded_token
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
        except ValueError as e:
            # Public key fetch error - fallback to dev mode if enabled
            dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
            if dev_mode:
                # In dev mode, decode without verification
                try:
                    decoded = jwt.decode(token, options={"verify_signature": False})
                    return decoded
                except:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token verification failed"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Token verification service error: {str(e)}"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}"
            )

# Singleton instance
jwt_verifier = JWTVerifier()

