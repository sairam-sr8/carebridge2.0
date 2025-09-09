"""
Celery Background Workers - Phase 2
Async task processing for moderation, notifications, and data processing
"""

from celery import Celery
import os
from datetime import datetime, timedelta
from typing import Dict, Any
import asyncio

# Celery configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./carebridge.db")

# Create Celery app with fallback
try:
    celery_app = Celery(
        "carebridge_workers",
        broker=REDIS_URL,
        backend=REDIS_URL,
        include=["workers.tasks"]
    )
    # Test Redis connection
    celery_app.control.inspect().stats()
    print("Celery Redis connection established successfully")
except Exception as e:
    print(f"Warning: Celery Redis connection failed: {e}. Using in-memory broker.")
    celery_app = Celery(
        "carebridge_workers",
        broker="memory://",
        backend="memory://",
        include=["workers.tasks"]
    )

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Import tasks
from .tasks import (
    process_moderation_task,
    send_notification_task,
    generate_ai_response_task,
    process_triage_task,
    audit_log_task,
    escalation_task
)
