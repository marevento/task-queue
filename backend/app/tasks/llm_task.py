import json
import time
import random
from datetime import datetime

import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.celery_app import celery_app
from app.config import settings
from app.models import Task

# Create sync database connection for Celery tasks
sync_engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Create Redis client for publishing updates
redis_client = redis.from_url(settings.redis_url)


def publish_progress(task_id: str, status: str, progress: int, result: str = None, error: str = None):
    """Publish task progress update to Redis pub/sub."""
    message = {
        "task_id": task_id,
        "status": status,
        "progress": progress,
        "result": result,
        "error": error,
        "timestamp": datetime.utcnow().isoformat(),
    }
    redis_client.publish("task_updates", json.dumps(message))


def update_task_in_db(task_id: str, status: str, progress: int, result: str = None, error: str = None):
    """Update task status in database."""
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            task.status = status
            task.progress = progress
            task.result = result
            task.error = error
            task.updated_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


@celery_app.task(name="mock_llm_task")
def mock_llm_task(task_id: str, duration: int = 30):
    """
    Mock LLM task that simulates long-running processing.

    Args:
        task_id: UUID of the task in database
        duration: Duration in seconds for the mock processing
    """
    try:
        # Update status to running
        update_task_in_db(task_id, "running", 0)
        publish_progress(task_id, "running", 0)

        # Simulate processing with progress updates
        for i in range(duration):
            # Sleep for 1 second (simulating work)
            time.sleep(1)

            # Calculate progress
            progress = int((i + 1) / duration * 100)

            # Update progress
            update_task_in_db(task_id, "running", progress)
            publish_progress(task_id, "running", progress)

            # Simulate occasional "thinking" messages
            if i % 5 == 0 and i > 0:
                thinking_messages = [
                    "Processing input...",
                    "Analyzing context...",
                    "Generating response...",
                    "Refining output...",
                ]
                message = random.choice(thinking_messages)
                publish_progress(task_id, "running", progress, result=message)

        # Generate mock result
        result = f"Task completed successfully! Processed for {duration} seconds. " \
                 f"This is a mock LLM response that would normally contain the generated text."

        # Update as completed
        update_task_in_db(task_id, "completed", 100, result=result)
        publish_progress(task_id, "completed", 100, result=result)

        return {"status": "completed", "result": result}

    except Exception as e:
        error_message = str(e)
        update_task_in_db(task_id, "failed", 0, error=error_message)
        publish_progress(task_id, "failed", 0, error=error_message)
        raise
