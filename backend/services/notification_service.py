"""
Notification Service - Phase 4
Multi-channel notification system (SMS, Email, Push)
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
import aiohttp
from enum import Enum

class NotificationChannel(Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBHOOK = "webhook"

class NotificationPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationService:
    """Multi-channel notification service"""
    
    def __init__(self):
        # Email configuration (SendGrid)
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.sendgrid_from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@carebridge.com")
        
        # SMS configuration (Twilio)
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_from_number = os.getenv("TWILIO_FROM_NUMBER")
        
        # Push notification configuration
        self.firebase_server_key = os.getenv("FIREBASE_SERVER_KEY")
        
        # Webhook configuration
        self.webhook_urls = {
            "admin": os.getenv("ADMIN_WEBHOOK_URL"),
            "doctor": os.getenv("DOCTOR_WEBHOOK_URL"),
            "patient": os.getenv("PATIENT_WEBHOOK_URL")
        }
    
    async def send_notification(
        self,
        recipient: str,
        message: str,
        channels: List[NotificationChannel],
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        metadata: Dict[str, Any] = None,
        user_type: str = "patient"
    ) -> Dict[str, Any]:
        """Send notification via multiple channels"""
        
        results = {}
        
        for channel in channels:
            try:
                if channel == NotificationChannel.EMAIL:
                    result = await self._send_email(recipient, message, priority, metadata)
                elif channel == NotificationChannel.SMS:
                    result = await self._send_sms(recipient, message, priority, metadata)
                elif channel == NotificationChannel.PUSH:
                    result = await self._send_push(recipient, message, priority, metadata, user_type)
                elif channel == NotificationChannel.WEBHOOK:
                    result = await self._send_webhook(recipient, message, priority, metadata, user_type)
                else:
                    result = {"success": False, "error": f"Unsupported channel: {channel}"}
                
                results[channel.value] = result
                
            except Exception as e:
                results[channel.value] = {"success": False, "error": str(e)}
        
        return {
            "overall_success": any(result.get("success", False) for result in results.values()),
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _send_email(
        self, 
        recipient: str, 
        message: str, 
        priority: NotificationPriority,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send email notification via SendGrid"""
        
        if not self.sendgrid_api_key:
            return {"success": False, "error": "SendGrid API key not configured"}
        
        try:
            # Determine email template based on priority
            subject = self._get_email_subject(priority)
            html_content = self._get_email_template(message, priority, metadata)
            
            # SendGrid API call
            url = "https://api.sendgrid.com/v3/mail/send"
            headers = {
                "Authorization": f"Bearer {self.sendgrid_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "personalizations": [{
                    "to": [{"email": recipient}],
                    "subject": subject
                }],
                "from": {"email": self.sendgrid_from_email},
                "content": [{
                    "type": "text/html",
                    "value": html_content
                }]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data) as response:
                    if response.status == 202:
                        return {"success": True, "message_id": "sendgrid_success"}
                    else:
                        error_text = await response.text()
                        return {"success": False, "error": f"SendGrid error: {error_text}"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _send_sms(
        self, 
        recipient: str, 
        message: str, 
        priority: NotificationPriority,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send SMS notification via Twilio"""
        
        if not self.twilio_account_sid or not self.twilio_auth_token:
            return {"success": False, "error": "Twilio credentials not configured"}
        
        try:
            # Truncate message for SMS
            sms_message = message[:160] if len(message) > 160 else message
            
            # Twilio API call
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json"
            
            auth = aiohttp.BasicAuth(self.twilio_account_sid, self.twilio_auth_token)
            data = {
                "From": self.twilio_from_number,
                "To": recipient,
                "Body": sms_message
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, auth=auth, data=data) as response:
                    if response.status == 201:
                        result = await response.json()
                        return {"success": True, "message_id": result.get("sid")}
                    else:
                        error_text = await response.text()
                        return {"success": False, "error": f"Twilio error: {error_text}"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _send_push(
        self, 
        recipient: str, 
        message: str, 
        priority: NotificationPriority,
        metadata: Dict[str, Any],
        user_type: str
    ) -> Dict[str, Any]:
        """Send push notification via Firebase"""
        
        if not self.firebase_server_key:
            return {"success": False, "error": "Firebase server key not configured"}
        
        try:
            # Firebase FCM API call
            url = "https://fcm.googleapis.com/fcm/send"
            headers = {
                "Authorization": f"key={self.firebase_server_key}",
                "Content-Type": "application/json"
            }
            
            # Determine notification title based on priority
            title = self._get_push_title(priority, user_type)
            
            data = {
                "to": recipient,  # This should be the FCM token
                "notification": {
                    "title": title,
                    "body": message,
                    "sound": "default",
                    "badge": 1
                },
                "data": {
                    "priority": priority.value,
                    "user_type": user_type,
                    "timestamp": datetime.utcnow().isoformat(),
                    "metadata": json.dumps(metadata or {})
                },
                "priority": "high" if priority in [NotificationPriority.HIGH, NotificationPriority.CRITICAL] else "normal"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {"success": True, "message_id": result.get("message_id")}
                    else:
                        error_text = await response.text()
                        return {"success": False, "error": f"Firebase error: {error_text}"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _send_webhook(
        self, 
        recipient: str, 
        message: str, 
        priority: NotificationPriority,
        metadata: Dict[str, Any],
        user_type: str
    ) -> Dict[str, Any]:
        """Send webhook notification"""
        
        webhook_url = self.webhook_urls.get(user_type)
        if not webhook_url:
            return {"success": False, "error": f"No webhook URL configured for {user_type}"}
        
        try:
            payload = {
                "recipient": recipient,
                "message": message,
                "priority": priority.value,
                "user_type": user_type,
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": metadata or {}
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status in [200, 201, 202]:
                        return {"success": True, "status_code": response.status}
                    else:
                        error_text = await response.text()
                        return {"success": False, "error": f"Webhook error: {error_text}"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _get_email_subject(self, priority: NotificationPriority) -> str:
        """Get email subject based on priority"""
        subjects = {
            NotificationPriority.LOW: "CareBridge Update",
            NotificationPriority.MEDIUM: "CareBridge Notification",
            NotificationPriority.HIGH: "URGENT: CareBridge Alert",
            NotificationPriority.CRITICAL: "CRITICAL: CareBridge Emergency"
        }
        return subjects[priority]
    
    def _get_email_template(self, message: str, priority: NotificationPriority, metadata: Dict[str, Any]) -> str:
        """Get HTML email template"""
        
        priority_colors = {
            NotificationPriority.LOW: "#3b82f6",
            NotificationPriority.MEDIUM: "#f59e0b", 
            NotificationPriority.HIGH: "#ef4444",
            NotificationPriority.CRITICAL: "#dc2626"
        }
        
        color = priority_colors[priority]
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>CareBridge Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: {color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">CareBridge</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Mental Health Platform</p>
                </div>
                <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
                    <h2 style="color: {color}; margin-top: 0;">Notification</h2>
                    <p style="font-size: 16px;">{message}</p>
                    <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid {color};">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            Priority: <strong>{priority.value.upper()}</strong><br>
                            Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _get_push_title(self, priority: NotificationPriority, user_type: str) -> str:
        """Get push notification title"""
        titles = {
            NotificationPriority.LOW: "CareBridge Update",
            NotificationPriority.MEDIUM: "CareBridge Alert",
            NotificationPriority.HIGH: "URGENT CareBridge Alert",
            NotificationPriority.CRITICAL: "CRITICAL CareBridge Alert"
        }
        return titles[priority]

# Global notification service instance
notification_service = NotificationService()
