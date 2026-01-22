export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  name: string;
  duration: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface TaskProgressUpdate {
  task_id: string;
  status: Task['status'];
  progress: number;
  result?: string | null;
  error?: string | null;
  timestamp?: string;
}
