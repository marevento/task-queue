# LLM Task Queue Demo

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A production-pattern demo for handling long-running LLM tasks with job queues. Python backend (FastAPI + Celery), React frontend, and WebSocket for real-time progress updates.

## Data Flow

Frontend submits task via REST → Backend writes to PostgreSQL and enqueues in Celery via Redis → Worker executes task, updates PostgreSQL, and publishes progress to Redis pub/sub → Backend's WebSocket handler subscribes to Redis and forwards updates to Frontend in real-time.

## Tech Stack

- **Backend**: FastAPI, Celery, SQLAlchemy, Redis, PostgreSQL
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Infrastructure**: Docker Compose
- **Real-time**: WebSocket (native FastAPI WebSocket + Redis pub/sub)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Running with Docker Compose

```bash
# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows

# Install dependencies
pip install -e ".[dev]"

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Celery worker (in another terminal)
celery -A app.celery_app worker --loglevel=info
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/{id}` | Get task details |
| WS | `/ws/tasks` | WebSocket for real-time updates |

## Project Structure

```
task-queue/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings
│   │   ├── database.py          # DB connection
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── celery_app.py        # Celery configuration
│   │   ├── api/
│   │   │   ├── tasks.py         # Task endpoints
│   │   │   └── websocket.py     # WebSocket handler
│   │   └── tasks/
│   │       └── llm_task.py      # Mock LLM task
│   └── tests/
│       └── test_tasks.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   └── tasks.ts
        ├── hooks/
        │   └── useTaskWebSocket.ts
        ├── components/
        │   ├── TaskForm.tsx
        │   ├── TaskList.tsx
        │   └── TaskCard.tsx
        └── types/
            └── task.ts
```

## How It Works

1. **Task Submission**: User submits a task through the React frontend
2. **Queue Processing**: FastAPI receives the request and enqueues it in Celery via Redis
3. **Background Execution**: Celery worker picks up the task and executes the mock LLM processing
4. **Progress Updates**: Worker publishes progress updates to Redis pub/sub
5. **Real-time UI**: WebSocket connection broadcasts updates to connected clients
6. **Completion**: Task result is stored in PostgreSQL and displayed in the UI

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql://... | PostgreSQL connection string |
| REDIS_URL | redis://localhost:6379/0 | Redis connection string |
| CORS_ORIGINS | http://localhost:3000 | Allowed CORS origins |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:8000 | Backend API URL |
| VITE_WS_URL | ws://localhost:8000 | WebSocket URL |

## License

MIT
