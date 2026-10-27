import { useState, useEffect } from 'react';
import { generateId, formatRelativeTime } from '@al/shared';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 0 | 1 | 2 | 3;
  dueDate?: Date;
  reminderDate?: Date;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all');
  const [filterPriority, setFilterPriority] = useState<0 | 1 | 2 | 3 | 'all'>('all');

  // Mock data for now
  // TODO: Fetch from API
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setTasks([
        {
          id: generateId(),
          title: 'Zaimplementować system pamięci',
          description: 'Zbudować Context Builder z przyrostowymi podsumowaniami rozmów',
          status: 'in_progress',
          priority: 2,
          dueDate: new Date(Date.now() + 86400000),
          projectId: generateId(),
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Dodać integrację z GitHub',
          description: 'Zaimplementować konektor GitHub z obsługą pull requestów',
          status: 'todo',
          priority: 1,
          dueDate: new Date(Date.now() + 259200000),
          projectId: generateId(),
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Testy jednostkowe',
          description: 'Napisać testy dla serwisów AI i bazy danych',
          status: 'todo',
          priority: 3,
          dueDate: new Date(Date.now() + 172800000),
          projectId: generateId(),
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Dokumentacja API',
          description: 'Uzupełnić dokumentację endpointów API',
          status: 'done',
          priority: 0,
          dueDate: new Date(Date.now() - 345600000),
          projectId: generateId(),
          createdAt: new Date(Date.now() - 345600000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Optymalizacja wydajności',
          description: 'Zoptymalizować zapytania do bazy danych',
          status: 'todo',
          priority: 2,
          projectId: generateId(),
          createdAt: new Date(Date.now() - 432000000),
          updatedAt: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      description: '',
      status: 'todo',
      priority: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setShowCreateModal(false);
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date() } : task
    ));
  };

  const handlePriorityChange = (taskId: string, newPriority: Task['priority']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, priority: newPriority, updatedAt: new Date() } : task
    ));
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const archivedTasks = tasks.filter(t => t.status === 'archived');

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'todo': return 'bg-primary-600/20 text-primary-400';
      case 'in_progress': return 'bg-blue-600/20 text-blue-400';
      case 'done': return 'bg-green-600/20 text-green-400';
      case 'archived': return 'bg-gray-600/20 text-gray-400';
      default: return 'bg-primary-600/20 text-primary-400';
    }
  };

  const getStatusLabel = (status: Task['status']): string => {
    switch (status) {
      case 'todo': return 'Do zrobienia';
      case 'in_progress': return 'W trakcie';
      case 'done': return 'Zrobione';
      case 'archived': return 'Zarchiwizowane';
      default: return status;
    }
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 0: return 'text-primary-400';
      case 1: return 'text-green-400';
      case 2: return 'text-yellow-400';
      case 3: return 'text-red-400';
      default: return 'text-primary-400';
    }
  };

  const getPriorityLabel = (priority: Task['priority']): string => {
    switch (priority) {
      case 0: return 'Brak';
      case 1: return 'Niski';
      case 2: return 'Średni';
      case 3: return 'Wysoki';
      default: return 'Brak';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-50">Zadania</h1>
          <p className="text-primary-400 mt-1">Śledź swoje postępy</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <span>+</span>
          <span className="hidden sm:inline">Nowe zadanie</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center p-3">
          <div className="text-xl font-bold text-primary-50">{todoTasks.length}</div>
          <div className="text-xs text-primary-400">Do zrobienia</div>
        </div>
        <div className="card text-center p-3">
          <div className="text-xl font-bold text-blue-400">{inProgressTasks.length}</div>
          <div className="text-xs text-primary-400">W trakcie</div>
        </div>
        <div className="card text-center p-3">
          <div className="text-xl font-bold text-green-400">{doneTasks.length}</div>
          <div className="text-xs text-primary-400">Zrobione</div>
        </div>
        <div className="card text-center p-3">
          <div className="text-xl font-bold text-primary-400">{archivedTasks.length}</div>
          <div className="text-xs text-primary-400">Archiwum</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-primary-300 mb-2">
              Status
            </label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="input"
            >
              <option value="all">Wszystkie</option>
              <option value="todo">Do zrobienia</option>
              <option value="in_progress">W trakcie</option>
              <option value="done">Zrobione</option>
              <option value="archived">Zarchiwizowane</option>
            </select>
          </div>
          <div>
            <label htmlFor="priorityFilter" className="block text-sm font-medium text-primary-300 mb-2">
              Priorytet
            </label>
            <select
              id="priorityFilter"
              value={filterPriority}
              onChange={(e) => setFilterPriority(parseInt(e.target.value) as typeof filterPriority)}
              className="input"
            >
              <option value="all">Wszystkie</option>
              <option value="0">Brak</option>
              <option value="1">Niski</option>
              <option value="2">Średni</option>
              <option value="3">Wysoki</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="spinner h-8 w-8 border-3" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state py-12">
          <div className="empty-state-icon text-4xl">✅</div>
          <div className="empty-state-title">Brak zadań</div>
          <div className="empty-state-description">
            {filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Brak zadań spełniających kryteria filtrów.'
              : 'Utwórz swoje pierwsze zadanie, aby zacząć organizować swoją pracę.'}
          </div>
          {filterStatus === 'all' && filterPriority === 'all' && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Utwórz zadanie
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
            />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-primary-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-50">Nowe zadanie</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTaskTitle('');
                }}
                className="text-primary-400 hover:text-primary-50 text-2xl"
                aria-label="Zamknij"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="taskTitle" className="block text-sm font-medium text-primary-300 mb-2">
                  Tytuł zadania
                </label>
                <input
                  type="text"
                  id="taskTitle"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Nazwa zadania"
                  autoFocus
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTaskTitle('');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="btn btn-primary flex-1"
                >
                  Utwórz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onPriorityChange: (taskId: string, newPriority: Task['priority']) => void;
}

const TaskCard = ({ task, onStatusChange, onPriorityChange }: TaskCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const statusColor = getStatusColor(task.status);
  const statusLabel = getStatusLabel(task.status);
  const priorityColor = getPriorityColor(task.priority);
  const priorityLabel = getPriorityLabel(task.priority);

  const handleSave = () => {
    if (editedTitle.trim()) {
      // TODO: Update task via API
      setIsEditing(false);
    }
  };

  return (
    <div className="card-hover p-4">
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              const newStatus = task.status === 'done' ? 'todo' : 'done';
              onStatusChange(task.id, newStatus);
            }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              task.status === 'done' 
                ? 'bg-green-600/20 border border-green-500' 
                : 'bg-primary-800 border border-primary-700 hover:bg-primary-700'
            }`}
            aria-label={task.status === 'done' ? 'Cofnij ukończenie' : 'Oznacz jako zrobione'}
          >
            {task.status === 'done' && <span className="text-green-400">✓</span>}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="input bg-transparent border-none text-primary-50"
                autoFocus
              />
            ) : (
              <h3 className={`font-semibold ${task.status === 'done' ? 'line-through text-primary-400' : 'text-primary-50'}`}>
                {task.title}
              </h3>
            )}
            
            <span className={`badge ${statusColor}`}>{statusLabel}</span>
            <span className={`badge ${priorityColor === 'text-primary-400' ? 'bg-primary-600/20' : priorityColor.replace('text-', 'bg-') + '/20'} ${priorityColor}`}>
              {priorityLabel}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className={`text-sm text-primary-400 ${isExpanded ? '' : 'line-clamp-1'} mb-3`}>
              {task.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-primary-500">
              {task.dueDate && (
                <span className={new Date(task.dueDate) < new Date() ? 'text-red-400' : ''}>
                  📅 {new Date(task.dueDate).toLocaleDateString('pl-PL')}
                </span>
              )}
              <span>🕒 {formatRelativeTime(task.updatedAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="p-1 text-green-400 hover:text-green-300"
                    aria-label="Zapisz"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-primary-400 hover:text-primary-300"
                    aria-label="Anuluj"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 text-primary-400 hover:text-primary-50"
                    aria-label={isExpanded ? 'Zwiń' : 'Rozwiń'}
                  >
                    {isExpanded ? '↑' : '↓'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-primary-400 hover:text-primary-50"
                    aria-label="Edytuj"
                  >
                    ✏️
                  </button>
                  <button className="p-1 text-primary-400 hover:text-primary-50">
                    ⋮
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
