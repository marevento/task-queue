import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
import uuid

# Note: These tests require the application to be properly set up with test databases
# For a complete test setup, you would need to configure pytest-asyncio and test database fixtures


@pytest.fixture
def mock_task_data():
    """Sample task data for testing."""
    return {
        "name": "Test Task",
        "duration": 10,
    }


@pytest.fixture
def mock_task_response():
    """Sample task response for testing."""
    return {
        "id": str(uuid.uuid4()),
        "name": "Test Task",
        "status": "pending",
        "progress": 0,
        "result": None,
        "error": None,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
    }


class TestTaskEndpoints:
    """Test cases for task API endpoints."""

    @pytest.mark.asyncio
    async def test_create_task_schema_validation(self, mock_task_data):
        """Test that task creation validates input correctly."""
        from app.schemas import TaskCreate

        # Valid data
        task = TaskCreate(**mock_task_data)
        assert task.name == "Test Task"
        assert task.duration == 10

        # Invalid duration (too short)
        with pytest.raises(ValueError):
            TaskCreate(name="Test", duration=2)

        # Invalid duration (too long)
        with pytest.raises(ValueError):
            TaskCreate(name="Test", duration=200)

        # Empty name
        with pytest.raises(ValueError):
            TaskCreate(name="", duration=30)

    def test_task_response_schema(self, mock_task_response):
        """Test task response schema parsing."""
        from app.schemas import TaskResponse

        task = TaskResponse(**mock_task_response)
        assert task.name == "Test Task"
        assert task.status == "pending"
        assert task.progress == 0

    def test_task_progress_update_schema(self):
        """Test task progress update schema."""
        from app.schemas import TaskProgressUpdate

        update = TaskProgressUpdate(
            task_id=str(uuid.uuid4()),
            status="running",
            progress=50,
        )
        assert update.status == "running"
        assert update.progress == 50
        assert update.result is None
        assert update.error is None


class TestTaskModel:
    """Test cases for Task database model."""

    def test_task_model_creation(self):
        """Test Task model instantiation."""
        from app.models import Task

        task = Task(
            name="Test Task",
            status="pending",
            progress=0,
        )
        assert task.name == "Test Task"
        assert task.status == "pending"
        assert task.progress == 0

    def test_task_model_repr(self):
        """Test Task model string representation."""
        from app.models import Task

        task = Task(
            id=uuid.uuid4(),
            name="Test Task",
            status="running",
        )
        repr_str = repr(task)
        assert "Test Task" in repr_str
        assert "running" in repr_str


class TestConfig:
    """Test cases for application configuration."""

    def test_cors_origins_parsing(self):
        """Test CORS origins are parsed correctly from comma-separated string."""
        from app.config import Settings

        settings = Settings(cors_origins="http://localhost:3000,http://example.com")
        origins = settings.cors_origins_list
        assert len(origins) == 2
        assert "http://localhost:3000" in origins
        assert "http://example.com" in origins

    def test_default_settings(self):
        """Test default configuration values."""
        from app.config import Settings

        settings = Settings()
        assert settings.app_name == "Task Queue"
        assert settings.debug is False
