"""
WebSocket Endpoints - Phase 2
Real-time communication endpoints
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from services.websocket_manager import connection_manager
from routers.auth import get_current_user_websocket
import json
import asyncio
from typing import Dict, Any

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/connect/{user_type}")
async def websocket_endpoint(websocket: WebSocket, user_type: str):
    """WebSocket endpoint for real-time updates"""
    user_id = None
    
    try:
        # Get user ID from query parameters or headers
        # In a real implementation, you'd validate the JWT token here
        user_id = websocket.query_params.get("user_id", "anonymous")
        
        # Connect to the manager
        await connection_manager.connect(websocket, user_type, user_id)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                await handle_websocket_message(websocket, user_type, user_id, message)
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"WebSocket error: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e),
                    "timestamp": asyncio.get_event_loop().time()
                }))
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        if user_id:
            connection_manager.disconnect(websocket, user_type, user_id)

async def handle_websocket_message(websocket: WebSocket, user_type: str, user_id: str, message: Dict[str, Any]):
    """Handle incoming WebSocket messages"""
    message_type = message.get("type")
    
    if message_type == "ping":
        # Respond to ping with pong
        await websocket.send_text(json.dumps({
            "type": "pong",
            "timestamp": asyncio.get_event_loop().time()
        }))
    
    elif message_type == "subscribe":
        # Handle subscription requests
        subscription_type = message.get("subscription_type")
        if subscription_type == "triage_updates" and user_type == "doctor":
            await websocket.send_text(json.dumps({
                "type": "subscription_confirmed",
                "subscription_type": "triage_updates",
                "message": "Subscribed to triage updates"
            }))
        elif subscription_type == "safety_alerts" and user_type in ["doctor", "admin"]:
            await websocket.send_text(json.dumps({
                "type": "subscription_confirmed", 
                "subscription_type": "safety_alerts",
                "message": "Subscribed to safety alerts"
            }))
    
    elif message_type == "get_status":
        # Send current connection status
        stats = connection_manager.get_connection_stats()
        await websocket.send_text(json.dumps({
            "type": "connection_status",
            "data": stats,
            "timestamp": asyncio.get_event_loop().time()
        }))
    
    else:
        # Unknown message type
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Unknown message type: {message_type}",
            "timestamp": asyncio.get_event_loop().time()
        }))

# REST endpoint to get WebSocket connection stats
@router.get("/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return {
        "stats": connection_manager.get_connection_stats(),
        "timestamp": asyncio.get_event_loop().time()
    }

# REST endpoint to send test message
@router.post("/test-message")
async def send_test_message(
    user_type: str,
    message: str,
    current_user: dict = Depends(get_current_user)
):
    """Send a test message to all users of a specific type"""
    if current_user.get('user_type') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can send test messages"
        )
    
    test_message = {
        "type": "test_message",
        "data": {
            "message": message,
            "sent_by": current_user.get('user_name', 'Admin')
        },
        "timestamp": asyncio.get_event_loop().time()
    }
    
    await connection_manager.broadcast_to_role(user_type, test_message)
    
    return {
        "success": True,
        "message": f"Test message sent to all {user_type}s",
        "recipients": connection_manager.get_connection_stats()[f"{user_type}_connections"]
    }
