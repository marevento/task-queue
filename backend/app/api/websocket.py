import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
import redis.asyncio as redis

from app.config import settings

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept and track new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection from tracking."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

manager = ConnectionManager()


async def redis_listener(websocket: WebSocket, stop_event: asyncio.Event):
    """Listen to Redis pub/sub and forward messages to WebSocket."""
    redis_client = None
    pubsub = None

    try:
        redis_client = redis.from_url(settings.redis_url)
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("task_updates")

        while not stop_event.is_set():
            try:
                message = await asyncio.wait_for(
                    pubsub.get_message(ignore_subscribe_messages=True),
                    timeout=0.5
                )
                if message and message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_text(data)
            except asyncio.TimeoutError:
                # No message, continue loop
                pass
            except Exception:
                break

    except Exception:
        pass
    finally:
        if pubsub:
            try:
                await pubsub.unsubscribe("task_updates")
                await pubsub.close()
            except Exception:
                pass
        if redis_client:
            try:
                await redis_client.close()
            except Exception:
                pass


@router.websocket("/ws/tasks")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time task updates."""
    await manager.connect(websocket)
    stop_event = asyncio.Event()

    # Start Redis listener task
    listener_task = asyncio.create_task(redis_listener(websocket, stop_event))

    try:
        while True:
            # Wait for any message from client (keeps connection alive)
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break

            if message["type"] == "websocket.receive":
                data = message.get("text", "")
                if data == "ping":
                    await websocket.send_text("pong")

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        stop_event.set()
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass
        manager.disconnect(websocket)
