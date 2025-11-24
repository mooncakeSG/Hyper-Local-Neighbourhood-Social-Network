"""
Input validation utilities
"""
import re
from typing import Optional
from pydantic import validator

def validate_phone(phone: Optional[str]) -> Optional[str]:
    """Validate South African phone number format"""
    if not phone:
        return phone
    
    # Remove spaces and dashes
    phone = re.sub(r'[\s-]', '', phone)
    
    # Check South African format: +27XXXXXXXXX or 0XXXXXXXXX
    if phone.startswith('+27'):
        if len(phone) == 12 and phone[3:].isdigit():
            return phone
    elif phone.startswith('0'):
        if len(phone) == 10 and phone[1:].isdigit():
            return '+27' + phone[1:]
    elif phone.startswith('27'):
        if len(phone) == 11 and phone[2:].isdigit():
            return '+' + phone
    
    raise ValueError("Invalid phone number format. Use +27XXXXXXXXX or 0XXXXXXXXX")

def validate_email(email: Optional[str]) -> Optional[str]:
    """Validate email format"""
    if not email:
        return email
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValueError("Invalid email format")
    
    return email.lower()

def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """Sanitize string input"""
    if not value:
        return value
    
    # Remove control characters
    value = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
    
    # Trim whitespace
    value = value.strip()
    
    # Check length
    if max_length and len(value) > max_length:
        raise ValueError(f"String too long. Maximum length: {max_length}")
    
    return value

def validate_url(url: Optional[str]) -> Optional[str]:
    """Validate URL format"""
    if not url:
        return url
    
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    if not re.match(pattern, url):
        raise ValueError("Invalid URL format")
    
    return url

