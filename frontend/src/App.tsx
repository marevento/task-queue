import { useState, useEffect, useCallback } from 'react';
import { Task, TaskCreate, TaskProgressUpdate } from './types/task';
import { createTask, listTasks } from './api/tasks';
import { useTaskWebSocket } from './hooks/useTaskWebSocket';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle WebSocket updates
  const handleWebSocketUpdate = useCallback((update: TaskProgressUpdate) => {
    setTasks((prevTasks) => {
      return prevTasks.map((task) => {
        if (task.id === update.task_id) {
          return {
            ...task,
            status: update.status,
            progress: update.progress,
            result: update.result ?? task.result,
            error: update.error ?? task.error,
            updated_at: update.timestamp ?? new Date().toISOString(),
          };
        }
        return task;
      });
    });
  }, []);

  const { status: wsStatus } = useTaskWebSocket({
    onUpdate: handleWebSocketUpdate,
  });

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await listTasks();
        setTasks(response.tasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Handle task creation
  const handleCreateTask = async (data: TaskCreate) => {
    setIsCreating(true);
    setError(null);
    try {
      const newTask = await createTask(data);
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  // Connection status indicator
  const statusConfig = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting...' },
    connected: { color: 'bg-green-500', text: 'Connected' },
    disconnected: { color: 'bg-red-500', text: 'Disconnected' },
  };

  const { color, text } = statusConfig[wsStatus];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Queue</h1>
          <p className="text-gray-600 mt-1">
            Submit long-running tasks and track their progress in real-time
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
            <span className="text-sm text-gray-500">{text}</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-900 font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <TaskForm onSubmit={handleCreateTask} isLoading={isCreating} />

        <TaskList tasks={tasks} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;
