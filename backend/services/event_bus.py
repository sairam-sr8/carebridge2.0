"""
Event Bus Service - Phase 2
Redis-based event system for reliable messaging
"""

import redis
import json
import asyncio
from typing import Dict, Any, Callable, List
from datetime import datetime
import os
from enum import Enum

class EventType(Enum):
    # Patient Events
    INTERACTION_CREATED = "interaction.created"
    MODERATION_CHECKED = "moderation.checked"
    SAFETY_FLAGGED = "safety.flagged"
    
    # Triage Events
    TRIAGE_ITEM_CREATED = "triage.item.created"
    TRIAGE_ACTION_TAKEN = "triage.action.taken"
    
    # Appointment Events
    APPOINTMENT_REQUEST_CREATED = "appointment.request.created"
    APPOINTMENT_REQUEST_REVIEWED = "appointment.request.reviewed"
    APPOINTMENT_SCHEDULED = "appointment.scheduled"
    
    # System Events
    ESCALATION_CREATED = "escalation.created"
    ESCALATION_RESOLVED = "escalation.resolved"
    AUDIT_LOGGED = "audit.logged"
    NOTIFICATION_SENT = "notification.sent"

class EventBus:
    """Redis-based event bus for reliable messaging"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
        self.subscribers = {}
        
    def publish_event(self, event_type: EventType, data: Dict[str, Any], metadata: Dict[str, Any] = None):
        """Publish an event to the event bus"""
        try:
            event = {
                "id": f"{event_type.value}_{datetime.utcnow().timestamp()}",
                "type": event_type.value,
                "data": data,
                "metadata": metadata or {},
                "timestamp": datetime.utcnow().isoformat(),
                "retry_count": 0
            }
            
            # Publish to Redis stream
            self.redis_client.xadd(
                "events",
                event,
                maxlen=10000  # Keep last 10k events
            )
            
            print(f"📡 Event published: {event_type.value}")
            return event["id"]
            
        except Exception as e:
            print(f"❌ Failed to publish event {event_type.value}: {e}")
            return None
    
    def subscribe_to_events(self, event_types: List[EventType], handler: Callable):
        """Subscribe to specific event types"""
        for event_type in event_types:
            if event_type not in self.subscribers:
                self.subscribers[event_type] = []
            self.subscribers[event_type].append(handler)
    
    async def start_event_consumer(self):
        """Start consuming events from Redis stream"""
        print("🔄 Starting event consumer...")
        
        while True:
            try:
                # Read from Redis stream
                messages = self.redis_client.xread(
                    {"events": "$"},  # Read from latest
                    count=10,
                    block=1000  # Block for 1 second
                )
                
                for stream, msgs in messages:
                    for msg_id, fields in msgs:
                        await self._process_event(msg_id, fields)
                        
            except Exception as e:
                print(f"❌ Event consumer error: {e}")
                await asyncio.sleep(1)
    
    async def _process_event(self, msg_id: str, fields: Dict[str, str]):
        """Process a single event"""
        try:
            # Parse event data
            event_data = json.loads(fields.get("data", "{}"))
            event_type = EventType(fields.get("type", ""))
            
            # Find subscribers for this event type
            handlers = self.subscribers.get(event_type, [])
            
            # Execute all handlers
            for handler in handlers:
                try:
                    await handler(event_type, event_data, fields.get("metadata", "{}"))
                except Exception as e:
                    print(f"❌ Handler error for {event_type.value}: {e}")
                    
        except Exception as e:
            print(f"❌ Failed to process event {msg_id}: {e}")
    
    def get_event_history(self, event_type: EventType = None, limit: int = 100):
        """Get recent event history"""
        try:
            if event_type:
                # Filter by event type
                events = self.redis_client.xrevrange(
                    "events",
                    count=limit,
                    start="+",
                    end="-"
                )
                filtered_events = [
                    (msg_id, fields) for msg_id, fields in events
                    if fields.get("type") == event_type.value
                ]
                return filtered_events[:limit]
            else:
                # Get all recent events
                return self.redis_client.xrevrange(
                    "events",
                    count=limit,
                    start="+",
                    end="-"
                )
        except Exception as e:
            print(f"❌ Failed to get event history: {e}")
            return []

# Global event bus instance
event_bus = EventBus()

# Event handlers
async def handle_interaction_created(event_type: EventType, data: Dict, metadata: Dict):
    """Handle interaction.created events"""
    print(f"📝 Processing interaction.created: {data}")
    # Trigger moderation check
    event_bus.publish_event(
        EventType.MODERATION_CHECKED,
        {"interaction_id": data.get("interaction_id")},
        {"triggered_by": "interaction_created"}
    )

async def handle_moderation_checked(event_type: EventType, data: Dict, metadata: Dict):
    """Handle moderation.checked events"""
    print(f"🔍 Processing moderation.checked: {data}")
    # Check if content is flagged
    if data.get("flagged", False):
        event_bus.publish_event(
            EventType.SAFETY_FLAGGED,
            {
                "interaction_id": data.get("interaction_id"),
                "severity": data.get("severity"),
                "confidence": data.get("confidence")
            },
            {"triggered_by": "moderation_checked"}
        )

async def handle_safety_flagged(event_type: EventType, data: Dict, metadata: Dict):
    """Handle safety.flagged events"""
    print(f"🚨 Processing safety.flagged: {data}")
    # Create triage item
    event_bus.publish_event(
        EventType.TRIAGE_ITEM_CREATED,
        {
            "safety_flag_id": data.get("safety_flag_id"),
            "patient_id": data.get("patient_id"),
            "severity": data.get("severity")
        },
        {"triggered_by": "safety_flagged"}
    )

# Register event handlers
event_bus.subscribe_to_events([EventType.INTERACTION_CREATED], handle_interaction_created)
event_bus.subscribe_to_events([EventType.MODERATION_CHECKED], handle_moderation_checked)
event_bus.subscribe_to_events([EventType.SAFETY_FLAGGED], handle_safety_flagged)
