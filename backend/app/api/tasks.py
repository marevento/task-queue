from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Task
from app.schemas import TaskCreate, TaskResponse, TaskListResponse
from app.tasks.llm_task import mock_llm_task

router = APIRouter()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskCreate, db: AsyncSession = Depends(get_db)):
    """Create a new task and submit it to the Celery queue."""
    # Create task in database
    task = Task(
        name=task_data.name,
        status="pending",
        progress=0,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # Submit task to Celery
    mock_llm_task.delay(str(task.id), task_data.duration)

    return task


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all tasks with pagination."""
    # Get total count
    count_query = select(func.count()).select_from(Task)
    total = (await db.execute(count_query)).scalar()

    # Get paginated tasks
    query = select(Task).order_by(desc(Task.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return TaskListResponse(tasks=tasks, total=total)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific task by ID."""
    query = select(Task).where(Task.id == task_id)
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    return task



