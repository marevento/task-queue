from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    name: str = Field(..., min_length=1, max_length=255, description="Name of the task")
    duration: int = Field(default=30, ge=5, le=120, description="Duration in seconds for mock processing")


class TaskResponse(BaseModel):
    """Schema for task response."""

    id: UUID
    name: str
    status: str
    progress: int
    result: str | None
    error: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskProgressUpdate(BaseModel):
    """Schema for task progress WebSocket updates."""

    task_id: str
    status: str
    progress: int
    result: str | None = None
    error: str | None = None


class TaskListResponse(BaseModel):
    """Schema for list of tasks response."""

    tasks: list[TaskResponse]
    total: int
