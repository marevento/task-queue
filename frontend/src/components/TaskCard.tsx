import { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
}

const statusColors: Record<Task['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const statusLabels: Record<Task['status'], string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

export function TaskCard({ task }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{task.name}</h3>
          <p className="text-xs text-gray-500">ID: {task.id}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[task.status]}`}>
          {statusLabels[task.status]}
        </span>
      </div>

      {(task.status === 'running' || task.status === 'pending') && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {task.status === 'completed' && task.result && (
        <div className="mb-3 p-3 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-gray-700">{task.result}</p>
        </div>
      )}

      {task.status === 'failed' && task.error && (
        <div className="mb-3 p-3 bg-red-50 rounded border border-red-200">
          <p className="text-sm text-red-700">{task.error}</p>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <span>Created: {formatDate(task.created_at)}</span>
      </div>
    </div>
  );
}
