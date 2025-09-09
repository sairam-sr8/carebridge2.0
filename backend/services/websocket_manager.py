"""
WebSocket Manager - Phase 2
Real-time communication for live updates
"""

import asyncio
import json
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by user type and ID
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "admin": set(),
            "doctor": set(),
            "patient": set()
        }
        
        # Store connections by user ID for targeted messaging
        self.user_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, user_type: str, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        # Add to active connections
        self.active_connections[user_type].add(websocket)
        self.user_connections[user_id] = websocket
        
        logger.info(f"WebSocket connected: {user_type} {user_id}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "message": "Connected to CareBridge real-time updates",
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)
    
    def disconnect(self, websocket: WebSocket, user_type: str, user_id: str):
        """Remove a WebSocket connection"""
        self.active_connections[user_type].discard(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]
        
        logger.info(f"WebSocket disconnected: {user_type} {user_id}")
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send a message to a specific user"""
        if user_id in self.user_connections:
            await self.send_personal_message(message, self.user_connections[user_id])
    
    async def broadcast_to_role(self, user_type: str, message: Dict[str, Any]):
        """Broadcast a message to all users of a specific role"""
        if user_type in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[user_type]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send to {user_type}: {e}")
                    disconnected.add(websocket)
            
            # Clean up disconnected connections
            self.active_connections[user_type] -= disconnected
    
    async def broadcast_triage_update(self, triage_item: Dict[str, Any]):
        """Broadcast triage item updates to doctors"""
        message = {
            "type": "triage_update",
            "data": triage_item,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_role("doctor", message)
    
    async def broadcast_safety_alert(self, patient_id: str, severity: str):
        """Broadcast safety alerts to doctors and admins"""
        message = {
            "type": "safety_alert",
            "data": {
                "patient_id": patient_id,
                "severity": severity,
                "message": f"Safety alert: {severity} risk detected"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to doctors and admins
        await self.broadcast_to_role("doctor", message)
        await self.broadcast_to_role("admin", message)
    
    async def send_patient_notification(self, patient_id: str, notification: Dict[str, Any]):
        """Send notification to a specific patient"""
        message = {
            "type": "patient_notification",
            "data": notification,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_to_user(patient_id, message)
    
    async def broadcast_system_status(self, status: str, message: str):
        """Broadcast system status updates to all users"""
        broadcast_message = {
            "type": "system_status",
            "data": {
                "status": status,
                "message": message
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all user types
        for user_type in self.active_connections:
            await self.broadcast_to_role(user_type, broadcast_message)
    
    def get_connection_stats(self) -> Dict[str, int]:
        """Get statistics about active connections"""
        return {
            "admin_connections": len(self.active_connections["admin"]),
            "doctor_connections": len(self.active_connections["doctor"]),
            "patient_connections": len(self.active_connections["patient"]),
            "total_connections": sum(len(connections) for connections in self.active_connections.values())
        }

# Global connection manager
connection_manager = ConnectionManager()

# WebSocket event handlers
async def handle_triage_event(event_type: str, data: Dict[str, Any], metadata: Dict[str, Any]):
    """Handle triage-related events for real-time updates"""
    if event_type == "triage.item.created":
        await connection_manager.broadcast_triage_update(data)
    elif event_type == "triage.action.taken":
        await connection_manager.broadcast_triage_update(data)

async def handle_safety_event(event_type: str, data: Dict[str, Any], metadata: Dict[str, Any]):
    """Handle safety-related events for real-time updates"""
    if event_type == "safety.flagged":
        await connection_manager.broadcast_safety_alert(
            data.get("patient_id"),
            data.get("severity")
        )

async def handle_escalation_event(event_type: str, data: Dict[str, Any], metadata: Dict[str, Any]):
    """Handle escalation events for real-time updates"""
    if event_type == "escalation.created":
        await connection_manager.broadcast_system_status(
            "critical",
            f"Escalation created: {data.get('escalation_type')}"
        )
