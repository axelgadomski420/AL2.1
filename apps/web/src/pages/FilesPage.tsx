import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateId, formatRelativeTime, formatBytes } from '@al/shared';

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  url?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FilesPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock data for now
  // TODO: Fetch from API
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setFiles([
        {
          id: generateId(),
          name: 'bengallabel-project-plan',
          originalName: 'BengalLabel_Project_Plan.pdf',
          mimeType: 'application/pdf',
          size: 2450000,
          status: 'ready',
          url: '/files/bengallabel-project-plan.pdf',
          projectId: generateId(),
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'al-assistant-architecture',
          originalName: 'AL_Assistant_Architecture.md',
          mimeType: 'text/markdown',
          size: 45000,
          status: 'ready',
          url: '/files/al-assistant-architecture.md',
          projectId: generateId(),
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'api-documentation',
          originalName: 'API_Documentation.json',
          mimeType: 'application/json',
          size: 125000,
          status: 'processing',
          url: '/files/api-documentation.json',
          projectId: generateId(),
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'typescript-config',
          originalName: 'tsconfig.json',
          mimeType: 'application/json',
          size: 5000,
          status: 'ready',
          url: '/files/tsconfig.json',
          createdAt: new Date(Date.now() - 345600000),
          updatedAt: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 300);

    // Simulate upload completion
    setTimeout(() => {
      clearInterval(interval);
      const newFile: FileItem = {
        id: generateId(),
        name: file.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        status: 'ready',
        url: `/files/${file.name}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setFiles([newFile, ...files]);
      setIsUploading(false);
      setUploadProgress(0);
      setShowUploadModal(false);
    }, 3000);
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('text/') || mimeType.startsWith('application/json')) {
      return '📄';
    }
    if (mimeType.startsWith('application/pdf')) {
      return '📕';
    }
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    }
    if (mimeType.startsWith('audio/')) {
      return '🎵';
    }
    if (mimeType.startsWith('video/')) {
      return '🎬';
    }
    if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return '🗄️';
    }
    return '📁';
  };

  const getFileTypeLabel = (mimeType: string): string => {
    if (mimeType.startsWith('text/')) return 'Text';
    if (mimeType.startsWith('application/json')) return 'JSON';
    if (mimeType.startsWith('application/pdf')) return 'PDF';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.startsWith('video/')) return 'Video';
    return 'File';
  };

  const getStatusColor = (status: FileItem['status']): string => {
    switch (status) {
      case 'uploading': return 'bg-blue-600/20 text-blue-400';
      case 'processing': return 'bg-yellow-600/20 text-yellow-400';
      case 'ready': return 'bg-green-600/20 text-green-400';
      case 'error': return 'bg-red-600/20 text-red-400';
      default: return 'bg-primary-600/20 text-primary-400';
    }
  };

  const getStatusLabel = (status: FileItem['status']): string => {
    switch (status) {
      case 'uploading': return 'Przesyłanie';
      case 'processing': return 'Przetwarzanie';
      case 'ready': return 'Gotowy';
      case 'error': return 'Błąd';
      default: return status;
    }
  };

  const readyFiles = files.filter(f => f.status === 'ready');
  const processingFiles = files.filter(f => f.status === 'processing' || f.status === 'uploading');
  const errorFiles = files.filter(f => f.status === 'error');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-50">Pliki</h1>
          <p className="text-primary-400 mt-1">Zarządzaj swoimi dokumentami</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <span>+</span>
          <span className="hidden sm:inline">Prześlij plik</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-primary-50">{readyFiles.length}</div>
          <div className="text-sm text-primary-400">Gotowe</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-yellow-400">{processingFiles.length}</div>
          <div className="text-sm text-primary-400">Przetwarzane</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-red-400">{errorFiles.length}</div>
          <div className="text-sm text-primary-400">Błędy</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="spinner h-8 w-8 border-3" />
        </div>
      ) : files.length === 0 ? (
        <div className="empty-state py-12">
          <div className="empty-state-icon text-4xl">📁</div>
          <div className="empty-state-title">Brak plików</div>
          <div className="empty-state-description">
            Prześlij swój pierwszy plik, aby zacząć korzystać z funkcji wyszukiwania i analizy.
          </div>
          <div className="mt-6">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              Prześlij plik
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-primary-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-50">Prześlij plik</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadProgress(0);
                }}
                className="text-primary-400 hover:text-primary-50 text-2xl"
                aria-label="Zamknij"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  id="fileUpload"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isUploading ? 'border-primary-700 bg-primary-800/50' : 'border-primary-700 hover:border-primary-600'
                }`}>
                  {isUploading ? (
                    <div className="space-y-4">
                      <span className="spinner h-8 w-8 border-3 mx-auto" />
                      <div className="text-sm text-primary-400">
                        Przesyłanie: {Math.round(uploadProgress)}%
                      </div>
                      <div className="w-full bg-primary-700 rounded-full h-2">
                        <div
                          className="bg-accent-500 h-2 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📁</div>
                      <p className="text-primary-400">
                        Przeciągnij i upuść plik lub kliknij, aby wybrać
                      </p>
                      <p className="text-xs text-primary-500">
                        Obsługiwane formaty: PDF, TXT, MD, JSON, PNG, JPG
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadProgress(0);
                  }}
                  disabled={isUploading}
                  className="btn btn-secondary flex-1"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal (for images) */}
      {/* Would be implemented when file viewing is added */}
    </div>
  );
};

interface FileCardProps {
  file: FileItem;
}

const FileCard = ({ file }: FileCardProps) => {
  const icon = getFileIcon(file.mimeType);
  const typeLabel = getFileTypeLabel(file.mimeType);
  const statusColor = getStatusColor(file.status);
  const statusLabel = getStatusLabel(file.status);

  return (
    <div className="card-hover p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-primary-800 flex items-center justify-center text-2xl">
            {icon}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-primary-50 truncate">{file.originalName}</h3>
            <span className={`badge ${statusColor}`}>{statusLabel}</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-primary-400 mb-3">
            <span>{typeLabel}</span>
            <span>·</span>
            <span>{formatBytes(file.size)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-500">
              {formatRelativeTime(file.updatedAt)}
            </span>
            
            <div className="flex items-center gap-2">
              {file.status === 'ready' && file.url && (
                <a
                  href={file.url}
                  download={file.originalName}
                  className="p-1 text-primary-400 hover:text-primary-50"
                  aria-label="Pobierz plik"
                >
                  ↓
                </a>
              )}
              <button className="p-1 text-primary-400 hover:text-primary-50">
                ⋮
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
