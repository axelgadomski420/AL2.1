import { useState } from 'react';
import { Link } from 'react-router-dom';
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

const ProjectsPage = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Mock data for now
  // TODO: Fetch from API
  useState(() => {
    setIsLoading(true);
    setTimeout(() => {
      setProjects([
        {
          id: generateId(),
          name: 'BengalLabel',
          description: 'Projekt muzyczny - nowy album',
          color: '#f9a51a',
          icon: '🎵',
          isArchived: false,
          isPinned: true,
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'AL Assistant',
          description: 'Rozwój asystenta AI',
          color: '#404040',
          icon: '🤖',
          isArchived: false,
          isPinned: true,
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'Archiwum',
          description: 'Zakończone projekty',
          color: '#606060',
          icon: '📦',
          isArchived: true,
          isPinned: false,
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: generateId(),
      name: newProjectName.trim(),
      description: '',
      color: '#808080',
      icon: '📁',
      isArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProjects([...projects, newProject]);
    setNewProjectName('');
    setShowCreateModal(false);
  };

  const pinnedProjects = projects.filter(p => p.isPinned && !p.isArchived);
  const regularProjects = projects.filter(p => !p.isPinned && !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-50">Projekty</h1>
          <p className="text-primary-400 mt-1">Zarządzaj swoimi projektami</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <span>+</span>
          <span className="hidden sm:inline">Nowy projekt</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="spinner h-8 w-8 border-3" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pinned Projects */}
          {pinnedProjects.length > 0 && (
            <>
              <div className="col-span-full">
                <h2 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-3">
                  Przypięte
                </h2>
              </div>
              {pinnedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </>
          )}

          {/* Regular Projects */}
          {regularProjects.length > 0 && (
            <>
              <div className="col-span-full">
                <h2 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-3">
                  Projekty
                </h2>
              </div>
              {regularProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </>
          )}

          {/* Archived Projects */}
          {archivedProjects.length > 0 && (
            <>
              <div className="col-span-full">
                <h2 className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-3">
                  Archiwum
                </h2>
              </div>
              {archivedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} isArchived />
              ))}
            </>
          )}

          {/* Empty State */}
          {projects.length === 0 && (
            <div className="col-span-full empty-state py-12">
              <div className="empty-state-icon text-4xl">📁</div>
              <div className="empty-state-title">Brak projektów</div>
              <div className="empty-state-description">
                Utwórz swój pierwszy projekt, aby zacząć organizować swoją pracę.
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  Utwórz projekt
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-primary-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-50">Nowy projekt</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName('');
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
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nazwa projektu"
                  autoFocus
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
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

interface ProjectCardProps {
  project: Project;
  isArchived?: boolean;
}

const ProjectCard = ({ project, isArchived = false }: ProjectCardProps) => {
  return (
    <Link
      to={`/projects/${project.id}`}
      className={`card-hover p-4 rounded-xl transition-all ${isArchived ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{
          backgroundColor: project.color || '#808080',
        }}>
          <span>{project.icon || '📁'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-primary-50 truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-primary-400 truncate-2 mt-1">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-primary-500">
            <span>{formatRelativeTime(project.updatedAt)}</span>
            {isArchived && <span className="badge badge-info">Archiwum</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectsPage;
