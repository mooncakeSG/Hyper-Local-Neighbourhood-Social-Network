"""
NeighbourBot Backend API
Secure server-side proxy for Groq API and chatbot functionality
"""

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import groq
from groq import Groq
import json
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NeighbourBot API",
    description="Secure backend API for NeighbourBot chatbot",
    version="1.0.0"
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3001,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
groq_api_key = os.getenv("GROQ_API_KEY")
groq_model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")

if not groq_api_key:
    logger.warning("GROQ_API_KEY not found in environment variables")
    groq_client = None
else:
    try:
        groq_client = Groq(api_key=groq_api_key)
        logger.info("Groq client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        groq_client = None


# Request/Response Models
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation messages")
    intents: Optional[List[Dict[str, Any]]] = Field(default=[], description="Available intents")
    context: Optional[Dict[str, Any]] = Field(default={}, description="Additional context")


class ChatResponse(BaseModel):
    intent: Optional[str] = None
    entities: Dict[str, Any] = {}
    response: str
    error: Optional[bool] = False
    error_type: Optional[str] = None
    error_message: Optional[str] = None


class FormatRequest(BaseModel):
    intent: str
    api_data: Dict[str, Any]
    user_query: str = ""


class HealthResponse(BaseModel):
    status: str
    groq_available: bool
    message: str


# Utility Functions
def build_system_prompt(intents: List[Dict], neighbourhood_name: Optional[str] = None) -> str:
    """Build system prompt for Groq"""
    intent_descriptions = "\n".join([
        f"- {intent.get('name', 'unknown')}: {', '.join(intent.get('triggers', []))}"
        for intent in intents
    ])
    
    prompt = f"""You are NeighbourBot, an AI assistant for a hyper-local neighbourhood social network platform in South Africa.

Your purpose is to help users with:
- Viewing and creating neighbourhood posts and alerts
- Searching and listing items in the marketplace
- Finding local businesses
- Managing notifications
- Updating their neighbourhood

Available actions you can help users with:
{intent_descriptions}

Guidelines:
- Be friendly, helpful, and conversational
- Understand user queries and map them to available actions
- If a user wants to perform an action, clearly identify which intent it matches
- For ambiguous queries, ask clarifying questions
- Keep responses concise and natural
- Use South African context when relevant (e.g., currency in R, local terminology)
{f"- The user is in the neighbourhood: {neighbourhood_name}" if neighbourhood_name else ""}

When responding, ALWAYS format your response as valid JSON. Use this exact format:

If a user wants to perform an action:
{{
  "intent": "intent_name",
  "entities": {{ "key": "value" }},
  "response": "Your natural language response to the user"
}}

If no clear intent matches:
{{
  "intent": null,
  "entities": {{}},
  "response": "Your helpful response explaining what you can help with"
}}

IMPORTANT: Only return valid JSON. Do not include any text before or after the JSON object."""
    
    return prompt


def parse_groq_response(response_content: str) -> Dict[str, Any]:
    """Parse Groq response, handling JSON extraction"""
    try:
        # Try direct JSON parse
        return json.loads(response_content)
    except json.JSONDecodeError:
        # Try to extract JSON from text
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_content)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        
        # Fallback: return as plain response
        return {
            "intent": None,
            "entities": {},
            "response": response_content
        }


# API Endpoints

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check"""
    return {
        "status": "ok",
        "groq_available": groq_client is not None,
        "message": "NeighbourBot API is running"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    if groq_client:
        try:
            # Quick test to verify Groq is working (Groq SDK is synchronous, not async)
            test_response = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a test assistant. Respond with 'OK'."},
                    {"role": "user", "content": "Test"}
                ],
                model=groq_model,
                max_tokens=10
            )
            groq_working = test_response.choices[0].message.content is not None
        except Exception as e:
            logger.error(f"Groq health check failed: {e}")
            groq_working = False
    else:
        groq_working = False
    
    return {
        "status": "ok",
        "groq_available": groq_working,
        "message": "API is healthy" if groq_working else "API is running but Groq is unavailable"
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - processes user messages with Groq AI
    """
    if not groq_client:
        return ChatResponse(
            response="AI service is not available. Please check server configuration.",
            error=True,
            error_type="SERVICE_UNAVAILABLE",
            error_message="Groq API key not configured"
        )
    
    try:
        # Build messages array
        messages = []
        
        # Add system prompt
        neighbourhood_name = request.context.get("neighbourhoodName")
        system_prompt = build_system_prompt(request.intents or [], neighbourhood_name)
        messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history (last 10 messages)
        recent_history = (request.conversation_history or [])[-10:]
        for msg in recent_history:
            messages.append({
                "role": msg.role if msg.role in ["user", "assistant"] else "user",
                "content": msg.content
            })
        
        # Add current user message
        messages.append({"role": "user", "content": request.message})
        
        # Call Groq API (synchronous, not async)
        completion = groq_client.chat.completions.create(
            messages=messages,
            model=groq_model,
            temperature=0.7,
            max_tokens=500
        )
        
        response_content = completion.choices[0].message.content
        if not response_content:
            return ChatResponse(
                response="I received an empty response. Please try again.",
                error=True,
                error_type="EMPTY_RESPONSE"
            )
        
        # Parse response
        parsed = parse_groq_response(response_content)
        
        return ChatResponse(
            intent=parsed.get("intent"),
            entities=parsed.get("entities", {}),
            response=parsed.get("response", response_content)
        )
        
    except groq.RateLimitError:
        return ChatResponse(
            response="Rate limit exceeded. Please try again in a moment.",
            error=True,
            error_type="RATE_LIMIT",
            error_message="Too many requests"
        )
    except groq.APIError as e:
        logger.error(f"Groq API error: {e}")
        return ChatResponse(
            response="AI service error. Please try again later.",
            error=True,
            error_type="API_ERROR",
            error_message=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return ChatResponse(
            response="An unexpected error occurred. Please try again.",
            error=True,
            error_type="UNKNOWN_ERROR",
            error_message=str(e)
        )


@app.post("/format", response_model=Dict[str, str])
async def format_response(request: FormatRequest):
    """
    Format API response data into natural language
    """
    if not groq_client:
        return {"formatted": ""}
    
    try:
        prompt = f"""You are NeighbourBot. A user asked: "{request.user_query}"

The API returned the following data:
{json.dumps(request.api_data, indent=2)}

Intent: {request.intent}

Generate a friendly, natural response summarizing this data for the user. Be concise and helpful. If there's no data, explain that clearly."""
        
        # Call Groq API (synchronous, not async)
        completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are NeighbourBot, a helpful neighbourhood assistant. Generate concise, friendly responses."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=groq_model,
            temperature=0.7,
            max_tokens=300
        )
        
        formatted = completion.choices[0].message.content
        return {"formatted": formatted or ""}
        
    except Exception as e:
        logger.error(f"Format error: {e}")
        return {"formatted": ""}


@app.get("/test")
async def test_groq():
    """Test Groq API connection"""
    if not groq_client:
        return {"success": False, "error": "Groq client not initialized"}
    
    try:
        # Groq SDK is synchronous, not async
        test_response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a test assistant. Respond with 'OK'."},
                {"role": "user", "content": "Test"}
            ],
            model=groq_model,
            max_tokens=10
        )
        
        response = test_response.choices[0].message.content
        return {
            "success": True,
            "message": "Groq API is working",
            "response": response
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)

