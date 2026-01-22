import { useState } from 'react';
import { TaskCreate } from '../types/task';

interface TaskFormProps {
  onSubmit: (data: TaskCreate) => Promise<void>;
  isLoading: boolean;
}

export function TaskForm({ onSubmit, isLoading }: TaskFormProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    try {
      await onSubmit({ name: name.trim(), duration });
      setName('');
      setDuration(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Create New Task</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Task Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task name..."
          disabled={isLoading}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
          Duration (seconds): {duration}
        </label>
        <input
          type="range"
          id="duration"
          min="5"
          max="120"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>5s</span>
          <span>120s</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
}
