import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateId, formatRelativeTime } from '@al/shared';

interface Integration {
  id: string;
  name: string;
  type: 'github' | 'cloudflare' | 'notion' | 'google' | 'custom';
  isConnected: boolean;
  lastSync?: Date;
  syncError?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string>('');

  // Mock data for now
  // TODO: Fetch from API
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIntegrations([
        {
          id: generateId(),
          name: 'GitHub',
          type: 'github',
          isConnected: false,
          permissions: ['repo', 'pull_requests', 'issues'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'Cloudflare',
          type: 'cloudflare',
          isConnected: false,
          permissions: ['workers', 'd1', 'r2'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'Notion',
          type: 'notion',
          isConnected: false,
          permissions: ['databases', 'pages', 'blocks'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'Google Drive',
          type: 'google',
          isConnected: false,
          permissions: ['drive', 'docs', 'sheets'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const availableIntegrations = [
    { type: 'github', name: 'GitHub', description: 'Integracja z GitHub - zarządzaj repozytoriami, pull requestami i issue' },
    { type: 'cloudflare', name: 'Cloudflare', description: 'Integracja z Cloudflare - zarządzaj Workers, D1 i R2' },
    { type: 'notion', name: 'Notion', description: 'Integracja z Notion - dostęp do baz danych i stron' },
    { type: 'google', name: 'Google Drive', description: 'Integracja z Google Drive - dostęp do dokumentów i plików' },
  ];

  const connectedIntegrations = integrations.filter(i => i.isConnected);
  const disconnectedIntegrations = integrations.filter(i => !i.isConnected);

  const handleConnect = (type: string) => {
    setSelectedIntegrationType(type);
    setShowConnectModal(true);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(integrations.map(integration => 
      integration.id === id ? { ...integration, isConnected: false } : integration
    ));
  };

  const getIntegrationIcon = (type: string): string => {
    switch (type) {
      case 'github': return '🐙';
      case 'cloudflare': return '🟠';
      case 'notion': return '✏️';
      case 'google': return '🔍';
      default: return '🔗';
    }
  };

  const getIntegrationColor = (type: string): string => {
    switch (type) {
      case 'github': return 'bg-purple-600/20 text-purple-400';
      case 'cloudflare': return 'bg-orange-600/20 text-orange-400';
      case 'notion': return 'bg-gray-600/20 text-gray-400';
      case 'google': return 'bg-blue-600/20 text-blue-400';
      default: return 'bg-primary-600/20 text-primary-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-50">Integracje</h1>
          <p className="text-primary-400 mt-1">Podłącz zewnętrzne usługi</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="spinner h-8 w-8 border-3" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connected Integrations */}
          {connectedIntegrations.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-primary-50 mb-4">Połączone</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Available Integrations */}
          <section>
            <h2 className="text-lg font-semibold text-primary-50 mb-4">Dostępne integracje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableIntegrations.map((integration) => {
                const isAlreadyConnected = integrations.some(
                  i => i.type === integration.type && i.isConnected
                );
                
                return (
                  <div
                    key={integration.type}
                    className="card p-4 hover:border-primary-600 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getIntegrationColor(integration.type)}`}>
                          {getIntegrationIcon(integration.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-primary-50">{integration.name}</h3>
                        <p className="text-sm text-primary-400 mt-1">{integration.description}</p>
                        
                        <div className="flex items-center justify-between mt-4">
                          {isAlreadyConnected ? (
                            <span className="badge badge-success">Połączono</span>
                          ) : (
                            <button
                              onClick={() => handleConnect(integration.type)}
                              className="btn btn-primary text-sm"
                            >
                              Połącz
                            </button>
                          )}
                          
                          <Link
                            to={`/settings?integration=${integration.type}`}
                            className="text-xs text-primary-400 hover:text-primary-50"
                          >
                            Więcej
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Empty State */}
          {integrations.length === 0 && (
            <div className="empty-state py-12">
              <div className="empty-state-icon text-4xl">🔗</div>
              <div className="empty-state-title">Brak integracji</div>
              <div className="empty-state-description">
                Połącz swoją pierwszą usługę, aby rozszerzyć funkcjonalność AL.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-primary-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-50">
                Połącz {availableIntegrations.find(i => i.type === selectedIntegrationType)?.name || selectedIntegrationType}
              </h2>
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setSelectedIntegrationType('');
                }}
                className="text-primary-400 hover:text-primary-50 text-2xl"
                aria-label="Zamknij"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-primary-400 text-sm">
                Aby połączyć z {availableIntegrations.find(i => i.type === selectedIntegrationType)?.name || selectedIntegrationType},
                zostaniesz przekierowany do strony logowania. Po zalogowaniu i zatwierdzeniu
                uprawnień, integracja zostanie aktywowana.
              </p>

              <div className="p-4 bg-primary-800/50 rounded-lg">
                <h3 className="font-semibold text-primary-50 mb-2">Wymagane uprawnienia:</h3>
                <ul className="text-sm text-primary-400 space-y-1">
                  {availableIntegrations
                    .find(i => i.type === selectedIntegrationType)
                    ?.description.split('- ')
                    .slice(1)
                    .map((permission, index) => (
                      <li key={index}>• {permission}</li>
                    ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setSelectedIntegrationType('');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Anuluj
                </button>
                <button className="btn btn-primary flex-1">
                  Połącz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface IntegrationCardProps {
  integration: Integration;
  onDisconnect: (id: string) => void;
}

const IntegrationCard = ({ integration, onDisconnect }: IntegrationCardProps) => {
  const icon = getIntegrationIcon(integration.type);
  const color = getIntegrationColor(integration.type);

  return (
    <div className="card-hover p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
            {icon}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-primary-50">{integration.name}</h3>
            <span className="badge badge-success">Połączono</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-primary-400 mb-3">
            {integration.lastSync && (
              <span>🔄 Ostatnia synchronizacja: {formatRelativeTime(integration.lastSync)}</span>
            )}
            {integration.syncError && (
              <span className="text-red-400">⚠️ Błąd synchronizacji</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {integration.permissions.slice(0, 3).map((permission, index) => (
                <span key={index} className="badge badge-info text-xs">{permission}</span>
              ))}
              {integration.permissions.length > 3 && (
                <span className="badge badge-info text-xs">+{integration.permissions.length - 3}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost text-sm">
                Konfiguruj
              </button>
              <button
                onClick={() => onDisconnect(integration.id)}
                className="p-1 text-primary-400 hover:text-red-400"
                aria-label="Rozłącz"
              >
                🔌
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
