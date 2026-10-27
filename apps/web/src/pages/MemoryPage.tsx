import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateId, formatRelativeTime } from '@al/shared';

interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  type: 'fact' | 'preference' | 'context' | 'decision';
  sourceType: 'conversation' | 'document' | 'manual';
  sourceId: string;
  scope: 'global' | 'project';
  status: 'active' | 'archived' | 'invalid';
  confidence?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MemoryPage = () => {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fact' | 'preference' | 'context' | 'decision'>('all');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'project'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived' | 'invalid'>('active');

  // Mock data for now
  // TODO: Fetch from API
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setEntries([
        {
          id: generateId(),
          title: 'Ulubiony język programowania',
          content: 'Axel preferuje TypeScript do tworzenia aplikacji webowych. Używa go od 5 lat i ceni sobie typowanie statyczne.',
          type: 'preference',
          sourceType: 'conversation',
          sourceId: generateId(),
          scope: 'global',
          status: 'active',
          confidence: 0.95,
          tags: ['programowanie', 'TypeScript', 'preferencje'],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Projekt BengalLabel',
          content: 'BengalLabel to projekt muzyczny Axela. Jest to label wydający muzykę elektroniczną. Obecnie pracuje nad nowym albumem.',
          type: 'context',
          sourceType: 'manual',
          sourceId: generateId(),
          scope: 'global',
          status: 'active',
          confidence: 0.9,
          tags: ['muzyka', 'BengalLabel', 'projekt'],
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Decyzja: Wybór frameworka',
          content: 'Axel zdecydował się użyć Hono zamiast Express dla nowego backend API ze względu na lepszą wydajność i typowanie TypeScript.',
          type: 'decision',
          sourceType: 'conversation',
          sourceId: generateId(),
          scope: 'global',
          status: 'active',
          confidence: 0.85,
          tags: ['technologia', 'backend', 'decyzja'],
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          title: 'Fakt: Doświadczenie z React',
          content: 'Axel ma 7-letnie doświadczenie w pracy z React. Zna zarówno klasowe komponenty, jak i funkcjonalne z hookami.',
          type: 'fact',
          sourceType: 'document',
          sourceId: generateId(),
          scope: 'global',
          status: 'active',
          confidence: 0.98,
          tags: ['doświadczenie', 'React', 'fakt'],
          createdAt: new Date(Date.now() - 345600000),
          updatedAt: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredEntries = entries.filter(entry => {
    // Search filter
    if (searchQuery && !entry.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !entry.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filterType !== 'all' && entry.type !== filterType) {
      return false;
    }

    // Scope filter
    if (filterScope !== 'all' && entry.scope !== filterScope) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all' && entry.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const typeLabels: Record<string, string> = {
    fact: 'Fakt',
    preference: 'Preferencja',
    context: 'Kontekst',
    decision: 'Decyzja',
  };

  const typeColors: Record<string, string> = {
    fact: 'bg-blue-600/20 text-blue-400',
    preference: 'bg-purple-600/20 text-purple-400',
    context: 'bg-green-600/20 text-green-400',
    decision: 'bg-orange-600/20 text-orange-400',
  };

  const typeIcons: Record<string, string> = {
    fact: 'ℹ️',
    preference: '⭐',
    context: '📝',
    decision: '✅',
  };

  const scopeLabels: Record<string, string> = {
    global: 'Globalny',
    project: 'Projektowy',
  };

  const statusLabels: Record<string, string> = {
    active: 'Aktywny',
    archived: 'Zarchiwizowany',
    invalid: 'Nieprawidłowy',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-600/20 text-green-400',
    archived: 'bg-primary-600/20 text-primary-400',
    invalid: 'bg-red-600/20 text-red-400',
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-50">Pamięć AL</h1>
          <p className="text-primary-400 mt-1">
            Globalna pamięć kontekstowa twojego asystenta
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <span>+</span>
          <span className="hidden sm:inline">Dodaj wpis</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-primary-300 mb-2">
              Szukaj
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">🔍</span>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj w pamięci..."
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-primary-300 mb-2">
              Typ
            </label>
            <select
              id="typeFilter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="input"
            >
              <option value="all">Wszystkie</option>
              <option value="fact">Fakty</option>
              <option value="preference">Preferencje</option>
              <option value="context">Kontekst</option>
              <option value="decision">Decyzje</option>
            </select>
          </div>

          <div>
            <label htmlFor="scopeFilter" className="block text-sm font-medium text-primary-300 mb-2">
              Zakres
            </label>
            <select
              id="scopeFilter"
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value as typeof filterScope)}
              className="input"
            >
              <option value="all">Wszystkie</option>
              <option value="global">Globalne</option>
              <option value="project">Projektowe</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="active">Aktywne</option>
              <option value="archived">Zarchiwizowane</option>
              <option value="invalid">Nieprawidłowe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="spinner h-8 w-8 border-3" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="empty-state py-12">
          <div className="empty-state-icon text-4xl">🧠</div>
          <div className="empty-state-title">Brak wpisów pamięci</div>
          <div className="empty-state-description">
            {searchQuery || filterType !== 'all' || filterScope !== 'all' || filterStatus !== 'all' 
              ? 'Brak wyników spełniających kryteria wyszukiwania.'
              : 'Pamięć AL jest pusta. Rozpocznij rozmowę, aby zacząć gromadzić wiedzę.'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <MemoryEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Stats */}
      {entries.length > 0 && (
        <div className="mt-6 pt-4 border-t border-primary-800 text-center text-sm text-primary-400">
          {filteredEntries.length} z {entries.length} wpisów
        </div>
      )}
    </div>
  );
};

interface MemoryEntryCardProps {
  entry: MemoryEntry;
}

const MemoryEntryCard = ({ entry }: MemoryEntryCardProps) => {
  const typeLabel = typeLabels[entry.type] || entry.type;
  const typeColor = typeColors[entry.type] || 'bg-primary-600/20 text-primary-400';
  const typeIcon = typeIcons[entry.type] || '📄';
  const scopeLabel = scopeLabels[entry.scope] || entry.scope;
  const statusLabel = statusLabels[entry.status] || entry.status;
  const statusColor = statusColors[entry.status] || 'bg-primary-600/20 text-primary-400';

  return (
    <div className="card-hover p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${typeColor}`}>
            {typeIcon}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-primary-50 truncate">{entry.title}</h3>
            <span className={`badge ${typeColor}`}>{typeLabel}</span>
            <span className={`badge ${statusColor}`}>{statusLabel}</span>
            {entry.scope === 'project' && (
              <span className="badge badge-info">Projekt</span>
            )}
          </div>
          
          <p className="text-sm text-primary-400 line-clamp-2 mb-3">{entry.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-primary-500">
              <span>📅 {formatRelativeTime(entry.updatedAt)}</span>
              {entry.confidence && (
                <span className="text-primary-400">
                  ⭐ {Math.round(entry.confidence * 100)}%
                </span>
              )}
              {entry.sourceType === 'conversation' && (
                <Link to={`/chat/${entry.sourceId}`} className="text-accent-400 hover:text-accent-300">
                  💬
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {entry.tags.length > 0 && (
                <div className="flex gap-1">
                  {entry.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="badge badge-info text-xs">{tag}</span>
                  ))}
                  {entry.tags.length > 2 && (
                    <span className="badge badge-info text-xs">+{entry.tags.length - 2}</span>
                  )}
                </div>
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

export default MemoryPage;
