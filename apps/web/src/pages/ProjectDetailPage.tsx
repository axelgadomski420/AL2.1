import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { generateId, formatRelativeTime } from '@al/shared';

interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 0 | 1 | 2 | 3;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  id: string;
  title: string;
  model?: string;
  provider?: string;
  messageCount: number;
  updatedAt: Date;
}

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'conversations' | 'files'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedProject, setEditedProject] = useState<Partial<Project>>({});

  // Mock data for now
  // TODO: Fetch from API
  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    setTimeout(() => {
      setProject({
        id,
        name: 'BengalLabel',
        description: 'Projekt muzyczny - nowy album elektroniczny. Praca nad kolekcją 10 utworów, które będą wydane pod szyldem BengalLabel.',
        color: '#f9a51a',
        icon: '🎵',
        isArchived: false,
        isPinned: true,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(),
      });

      setTasks([
        {
          id: generateId(),
          title: 'Skończyć główny motyw',
          description: 'Dokończyć główny motyw dla pierwszego utworu',
          status: 'in_progress',
          priority: 3,
          dueDate: new Date(Date.now() + 86400000),
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Nagranie wokalu',
          description: 'Zarejestrować wokal dla drugiego utworu',
          status: 'todo',
          priority: 2,
          dueDate: new Date(Date.now() + 259200000),
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Miksowanie',
          description: 'Zmiksować pierwsze 5 utworów',
          status: 'todo',
          priority: 1,
          dueDate: new Date(Date.now() + 345600000),
          createdAt: new Date(Date.now() - 345600000),
          updatedAt: new Date(),
        },
      ]);

      setConversations([
        {
          id: generateId(),
          title: 'Dyskusja o stylistyce albumu',
          model: 'llama-3.1-70b-versatile',
          provider: 'groq',
          messageCount: 12,
          updatedAt: new Date(Date.now() - 86400000),
        },
        {
          id: generateId(),
          title: 'Pomoc przy masteringu',
          model: 'mistral-large',
          provider: 'mistral',
          messageCount: 8,
          updatedAt: new Date(Date.now() - 172800000),
        },
        {
          id: generateId(),
          title: 'Analiza trendów muzycznych',
          model: 'gpt-4o-mini',
          provider: 'openrouter',
          messageCount: 5,
          updatedAt: new Date(Date.now() - 259200000),
        },
      ]);

      setIsLoading(false);
    }, 500);
  }, [id]);

  const handleSaveProject = () => {
    // TODO: Update project via API
    if (project) {
      setProject({ ...project, ...editedProject, updatedAt: new Date() });
    }
    setShowEditModal(false);
    setEditedProject({});
  };

  const handleDeleteProject = () => {
    if (window.confirm(`Czy na pewno chcesz usunąć projekt "${project?.name}"?`)) {
      // TODO: Delete project via API
      navigate('/projects');
    }
  };

  const handleArchiveProject = () => {
    if (project) {
      // TODO: Archive project via API
      setProject({ ...project, isArchived: true, updatedAt: new Date() });
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="spinner h-8 w-8 border-3" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state py-12">
        <div className="empty-state-icon text-4xl">📁</div>
        <div className="empty-state-title">Projekt nie istnieje</div>
        <div className="empty-state-description">
          Projekt, którego szukasz, nie istnieje lub został usunięty.
        </div>
        <div className="mt-6">
          <button onClick={() => navigate('/projects')} className="btn btn-primary">
            Powrót do projektów
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 rounded-lg bg-primary-800 hover:bg-primary-700 text-primary-300 hover:text-primary-50 transition-colors"
            aria-label="Powrót"
          >
            ←
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{
              backgroundColor: project.color || '#808080',
            }}>
              <span>{project.icon || '📁'}</span>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-primary-50">{project.name}</h1>
              <p className="text-primary-400 mt-1">{project.description || 'Brak opisu'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="badge badge-info">
            Utworzono: {formatRelativeTime(project.createdAt)}
          </span>
          {project.isPinned && <span className="badge badge-success">Przypięty</span>}
          {project.isArchived && <span className="badge badge-warning">Zarchiwizowany</span>}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setShowEditModal(true)}
            className="btn btn-secondary text-sm"
          >
            Edytuj projekt
          </button>
          <button
            onClick={handleArchiveProject}
            className="btn btn-secondary text-sm"
          >
            {project.isArchived ? 'Przywróć' : 'Archiwizuj'}
          </button>
          <button
            onClick={handleDeleteProject}
            className="btn btn-danger text-sm"
          >
            Usuń projekt
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary-800 mb-6">
        <nav className="flex gap-8">
          {[
            { id: 'overview', label: 'Przegląd', icon: '📊' },
            { id: 'tasks', label: 'Zadania', icon: '✅' },
            { id: 'conversations', label: 'Konwersacje', icon: '💬' },
            { id: 'files', label: 'Pliki', icon: '📄' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-primary-400 hover:text-primary-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab project={project} tasks={tasks} conversations={conversations} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab tasks={tasks} projectId={project.id} />
        )}
        {activeTab === 'conversations' && (
          <ConversationsTab conversations={conversations} projectId={project.id} />
        )}
        {activeTab === 'files' && (
          <FilesTab projectId={project.id} />
        )}
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-primary-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-50">Edytuj projekt</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditedProject({});
                }}
                className="text-primary-400 hover:text-primary-50 text-2xl"
                aria-label="Zamknij"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-primary-300 mb-2">
                  Nazwa projektu
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={editedProject.name || project.name}
                  onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-primary-300 mb-2">
                  Opis
                </label>
                <textarea
                  id="projectDescription"
                  value={editedProject.description || project.description || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                  rows={4}
                  className="input resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditedProject({});
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSaveProject}
                  className="btn btn-primary flex-1"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface OverviewTabProps {
  project: Project;
  tasks: Task[];
  conversations: Conversation[];
}

const OverviewTab = ({ project, tasks, conversations }: OverviewTabProps) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-primary-400 mb-1">Postęp</div>
          <div className="text-2xl font-bold text-primary-50">{progress}%</div>
          <div className="w-full bg-primary-700 rounded-full h-2 mt-2">
            <div
              className="bg-accent-500 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-primary-400 mt-2">
            {completedTasks} z {totalTasks} zadań ukończonych
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm text-primary-400 mb-1">Konwersacje</div>
          <div className="text-2xl font-bold text-primary-50">{conversations.length}</div>
          <div className="text-xs text-primary-400 mt-2">
            {conversations.reduce((sum, c) => sum + c.messageCount, 0)} wiadomości
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm text-primary-400 mb-1">Data utworzenia</div>
          <div className="text-2xl font-bold text-primary-50">
            {project.createdAt.toLocaleDateString('pl-PL')}
          </div>
          <div className="text-xs text-primary-400 mt-2">
            {formatRelativeTime(project.createdAt)}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary-50 mb-4">Szybkie akcje</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="btn btn-secondary text-sm flex items-center justify-center gap-2 py-3">
            <span>+</span>
            <span>Nowe zadanie</span>
          </button>
          <button className="btn btn-secondary text-sm flex items-center justify-center gap-2 py-3">
            <span>💬</span>
            <span>Nowa rozmowa</span>
          </button>
          <button className="btn btn-secondary text-sm flex items-center justify-center gap-2 py-3">
            <span>📄</span>
            <span>Prześlij plik</span>
          </button>
          <button className="btn btn-secondary text-sm flex items-center justify-center gap-2 py-3">
            <span>📋</span>
            <span>Podsumowanie</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary-50 mb-4">Ostatnia aktywność</h3>
        <div className="space-y-3">
          {[...tasks, ...conversations]
            .sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
            .slice(0, 5)
            .map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-primary-800/50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center text-sm">
                  {'updatedAt' in item ? '📝' : '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-primary-50 truncate">
                    {'title' in item ? item.title : item.title}
                  </div>
                  <div className="text-xs text-primary-400">
                    {formatRelativeTime('updatedAt' in item ? item.updatedAt : item.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

interface TasksTabProps {
  tasks: Task[];
  projectId: string;
}

const TasksTab = ({ tasks, projectId }: TasksTabProps) => {
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all');

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="input w-48"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="todo">Do zrobienia</option>
          <option value="in_progress">W trakcie</option>
          <option value="done">Zrobione</option>
          <option value="archived">Zarchiwizowane</option>
        </select>

        <button className="btn btn-primary flex items-center gap-2">
          <span>+</span>
          <span>Nowe zadanie</span>
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state py-8">
          <div className="empty-state-icon text-3xl">✅</div>
          <div className="empty-state-title">Brak zadań</div>
          <div className="empty-state-description">
            Utwórz swoje pierwsze zadanie dla tego projektu.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

interface TaskRowProps {
  task: Task;
}

const TaskRow = ({ task }: TaskRowProps) => {
  const statusColor = getStatusColor(task.status);
  const statusLabel = getStatusLabel(task.status);

  return (
    <div className="card-hover p-4">
      <div className="flex items-center gap-4">
        <button className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${statusColor}`} />
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-primary-50">{task.title}</div>
          {task.description && (
            <div className="text-sm text-primary-400 truncate">{task.description}</div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {task.dueDate && (
            <span className={`text-xs ${new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-primary-400'}`}>
              {new Date(task.dueDate).toLocaleDateString('pl-PL')}
            </span>
          )}
          <span className="badge badge-info text-xs">{statusLabel}</span>
        </div>

        <button className="p-1 text-primary-400 hover:text-primary-50">⋮</button>
      </div>
    </div>
  );
};

interface ConversationsTabProps {
  conversations: Conversation[];
  projectId: string;
}

const ConversationsTab = ({ conversations, projectId }: ConversationsTabProps) => {
  return (
    <div className="space-y-4">
      <button className="btn btn-primary flex items-center gap-2">
        <span>+</span>
        <span>Nowa rozmowa</span>
      </button>

      {conversations.length === 0 ? (
        <div className="empty-state py-8">
          <div className="empty-state-icon text-3xl">💬</div>
          <div className="empty-state-title">Brak konwersacji</div>
          <div className="empty-state-description">
            Rozpocznij nową rozmowę, aby zacząć dyskusję na temat tego projektu.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/chat/${conversation.id}`}
              className="card-hover p-4 block"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-primary-50 truncate">{conversation.title}</div>
                  <div className="text-sm text-primary-400">
                    {conversation.model && (
                      <span>{conversation.model} · </span>
                    )}
                    {conversation.messageCount} wiadomości
                  </div>
                </div>
                <span className="text-xs text-primary-500">
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

interface FilesTabProps {
  projectId: string;
}

const FilesTab = ({ projectId }: FilesTabProps) => {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="empty-state">
          <div className="empty-state-icon text-3xl">📁</div>
          <div className="empty-state-title">Brak plików</div>
          <div className="empty-state-description">
            Prześlij swoje pierwsze pliki, aby były dostępne w kontekście tego projektu.
          </div>
          <div className="mt-4">
            <button className="btn btn-primary">
              Prześlij plik
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for TaskRow
const getStatusColor = (status: Task['status']): string => {
  switch (status) {
    case 'todo': return 'border-primary-500';
    case 'in_progress': return 'border-blue-500 bg-blue-600/20';
    case 'done': return 'border-green-500 bg-green-600/20';
    case 'archived': return 'border-gray-500';
    default: return 'border-primary-500';
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

export default ProjectDetailPage;
