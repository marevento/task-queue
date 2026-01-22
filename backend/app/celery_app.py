from celery import Celery

from app.config import settings

# Create Celery app
celery_app = Celery(
    "task_queue",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.llm_task"],
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    worker_prefetch_multiplier=1,  # Process one task at a time per worker
    result_expires=3600,  # Results expire after 1 hour
)
