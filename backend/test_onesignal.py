"""
Test script for OneSignal connection
Run this script to test your OneSignal configuration
"""
import asyncio
import os
from dotenv import load_dotenv
from app.services.onesignal_service import onesignal_service

load_dotenv()

async def test_connection():
    """Test OneSignal connection and configuration"""
    print("=" * 50)
    print("OneSignal Connection Test")
    print("=" * 50)
    print()
    
    # Check environment variables
    api_key = os.getenv("ONESIGNAL_API_KEY")
    app_id = os.getenv("ONESIGNAL_APP_ID")
    
    print("1. Checking Environment Variables:")
    print(f"   ONESIGNAL_API_KEY: {'✓ Set' if api_key else '✗ Missing'}")
    print(f"   ONESIGNAL_APP_ID: {'✓ Set' if app_id else '✗ Missing'}")
    print()
    
    if not api_key or not app_id:
        print("❌ ERROR: Missing OneSignal credentials!")
        print("\nPlease set the following in your .env file:")
        print("  ONESIGNAL_API_KEY=your_api_key")
        print("  ONESIGNAL_APP_ID=your_app_id")
        return False
    
    # Check service initialization
    print("2. Checking Service Initialization:")
    try:
        service = onesignal_service
        print(f"   Service initialized: ✓")
        print(f"   API URL: {service.api_url}")
        print()
    except Exception as e:
        print(f"   Service initialization failed: ✗")
        print(f"   Error: {e}")
        return False
    
    # Test configuration check
    print("3. Testing Configuration:")
    try:
        # Re-check after load_dotenv
        service.api_key = os.getenv("ONESIGNAL_API_KEY")
        service.app_id = os.getenv("ONESIGNAL_APP_ID")
        service._ensure_config()
        print("   Configuration valid: ✓")
        print(f"   App ID (first 10 chars): {app_id[:10]}...")
        print()
    except ValueError as e:
        print(f"   Configuration invalid: ✗")
        print(f"   Error: {e}")
        print(f"   API Key present: {bool(service.api_key)}")
        print(f"   App ID present: {bool(service.app_id)}")
        return False
    
    print("✅ OneSignal is properly configured!")
    print()
    print("To test sending a notification, use the API endpoint:")
    print("  POST http://localhost:8000/api/v1/notifications/test-send")
    print("  Body: {")
    print('    "player_id": "your-player-id",')
    print('    "title": "Test",')
    print('    "message": "Test message"')
    print("  }")
    print()
    print("Or use the test endpoint:")
    print("  GET http://localhost:8000/api/v1/notifications/test-connection")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_connection())

