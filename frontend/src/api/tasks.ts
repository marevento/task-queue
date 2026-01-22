import { Task, TaskCreate, TaskListResponse } from '../types/task';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }
  return response.json();
}

export async function createTask(data: TaskCreate): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Task>(response);
}

export async function listTasks(skip = 0, limit = 50): Promise<TaskListResponse> {
  const response = await fetch(`${API_URL}/api/tasks?skip=${skip}&limit=${limit}`);
  return handleResponse<TaskListResponse>(response);
}

export async function getTask(taskId: string): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`);
  return handleResponse<Task>(response);
}


