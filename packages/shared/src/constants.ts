// Application constants

export const APP_CONFIG = {
  NAME: 'AL',
  FULL_NAME: 'AL - Osobisty Asystent AI',
  DESCRIPTION: 'Osobisty asystent AI dla Axela',
  VERSION: '1.0.0',
  OWNER: 'Axel',
  DEFAULT_LANGUAGE: 'pl',
  THEME: {
    PRIMARY_COLOR: '#1a1a1a',
    ACCENT_COLOR: '#f9a51a',
    BACKGROUND: '#101010',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#a0a0a0',
  },
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Authentication Configuration
export const AUTH_CONFIG = {
  TOKEN_NAME: 'al_token',
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  REFRESH_TOKEN_NAME: 'al_refresh_token',
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  PASSWORD_MIN_LENGTH: 8,
  SESSION_MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
};

// AI Provider Configuration
export const AI_PROVIDERS = {
  MISTRAL: {
    ID: 'mistral',
    NAME: 'Mistral AI',
    TYPE: 'mistral' as const,
    BASE_URL: 'https://api.mistral.ai',
    DOCS_URL: 'https://docs.mistral.ai',
    FREE_TIER: true,
    REQUIRES_API_KEY: true,
    SUPPORTS_STREAMING: true,
    SUPPORTS_TOOLS: true,
  },
  GROQ: {
    ID: 'groq',
    NAME: 'Groq',
    TYPE: 'groq' as const,
    BASE_URL: 'https://api.groq.com',
    DOCS_URL: 'https://console.groq.com/docs',
    FREE_TIER: true,
    REQUIRES_API_KEY: true,
    SUPPORTS_STREAMING: true,
    SUPPORTS_TOOLS: false,
  },
  OPENROUTER: {
    ID: 'openrouter',
    NAME: 'OpenRouter',
    TYPE: 'openrouter' as const,
    BASE_URL: 'https://openrouter.ai/api',
    DOCS_URL: 'https://openrouter.ai/docs',
    FREE_TIER: true,
    REQUIRES_API_KEY: true,
    SUPPORTS_STREAMING: true,
    SUPPORTS_TOOLS: false,
  },
};

// Model Profiles
export const MODEL_PROFILES = {
  FAST: {
    ID: 'fast',
    NAME: 'Szybki',
    DESCRIPTION: 'Najszybsze modele z dobrym stosunkiem jakości do ceny',
    PREFERRED_PROVIDERS: ['groq', 'mistral'],
    PREFERRED_MODELS: ['llama-3.1-70b-versatile', 'mistral-large'],
  },
  QUALITY: {
    ID: 'quality',
    NAME: 'Jakościowy',
    DESCRIPTION: 'Modele o najwyższej jakości odpowiedzi',
    PREFERRED_PROVIDERS: ['mistral', 'openrouter'],
    PREFERRED_MODELS: ['mistral-large', 'gpt-4o-mini'],
  },
  CODE: {
    ID: 'code',
    NAME: 'Kod',
    DESCRIPTION: 'Modele zoptymalizowane do generowania kodu',
    PREFERRED_PROVIDERS: ['groq', 'openrouter'],
    PREFERRED_MODELS: ['llama-3.1-70b-versatile', 'gpt-4o-mini'],
  },
  ECONOMY: {
    ID: 'economy',
    NAME: 'Oszczędny',
    DESCRIPTION: 'Modele o najniższym koszcie',
    PREFERRED_PROVIDERS: ['groq', 'mistral'],
    PREFERRED_MODELS: ['llama3-8b-instant', 'mistral-small'],
  },
};

// Token Limits
export const TOKEN_LIMITS = {
  DEFAULT_CONTEXT_WINDOW: 32000,
  MAX_TOKENS_PER_REQUEST: 4096,
  MIN_TOKENS_PER_REQUEST: 1,
  MAX_CONTEXT_TOKENS: 128000,
  TOKEN_MARGIN: 100, // Safety margin for token counting
};

// File Configuration
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILE_SIZE_PRO: 100 * 1024 * 1024, // 100MB for pro users
  ALLOWED_MIME_TYPES: [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/json',
    'application/javascript',
    'application/typescript',
    'application/x-python',
    'application/x-shellscript',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
  ],
  ALLOWED_EXTENSIONS: [
    '.txt',
    '.md',
    '.pdf',
    '.json',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.sh',
    '.bash',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
  ],
  MAX_FILES_PER_USER: 100,
  MAX_FILES_PER_PROJECT: 50,
};

// Memory Configuration
export const MEMORY_CONFIG = {
  MAX_MEMORY_ENTRIES: 1000,
  MAX_MEMORY_TOKENS: 50000,
  MEMORY_INDEX_BATCH_SIZE: 100,
  MEMORY_UPDATE_INTERVAL: 60 * 1000, // 1 minute
  CONTEXT_BUILDER_MAX_TOKENS: 8000,
  CONTEXT_BUILDER_MEMORY_TOKENS: 2000,
  CONTEXT_BUILDER_PROJECT_TOKENS: 2000,
  CONTEXT_BUILDER_CONVERSATION_TOKENS: 4000,
};

// Search Configuration
export const SEARCH_CONFIG = {
  MAX_SEARCH_RESULTS: 50,
  SEARCH_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MIN_SEARCH_QUERY_LENGTH: 2,
  SEARCH_DEBOUNCE_MS: 300,
};

// Voice Configuration
export const VOICE_CONFIG = {
  DEFAULT_LANGUAGE: 'pl',
  DEFAULT_STT_MODEL: 'whisper-1',
  DEFAULT_TTS_VOICE: 'pl-PL-Wavenet-A',
  SUPPORTED_LANGUAGES: ['pl', 'en', 'de', 'fr', 'es', 'it'],
  AUDIO_SAMPLE_RATE: 16000,
  AUDIO_BIT_RATE: 128000,
  MAX_AUDIO_DURATION: 60, // seconds
  MAX_AUDIO_SIZE: 25 * 1024 * 1024, // 25MB
};

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  DEFAULT_WINDOW: 60, // 1 minute
  DEFAULT_MAX_REQUESTS: 60,
  AUTH_WINDOW: 3600, // 1 hour
  AUTH_MAX_REQUESTS: 100,
  AI_WINDOW: 60, // 1 minute
  AI_MAX_REQUESTS: 30,
  STORAGE_WINDOW: 3600, // 1 hour
  STORAGE_MAX_REQUESTS: 1000,
};

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
  JITTER: 0.1, // 10% jitter
};

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  TASK_REMINDER_ADVANCE: 15, // minutes before due date
  MAX_NOTIFICATIONS_PER_USER: 100,
  NOTIFICATION_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Security Configuration
export const SECURITY_CONFIG = {
  ENCRYPTION_VERSION: 1,
  KEY_ROTATION_INTERVAL: 90, // days
  SESSION_SECRET_LENGTH: 64,
  API_KEY_LENGTH: 32,
  PASSWORD_HASH_ROUNDS: 12,
  RATE_LIMIT_WINDOW: 15 * 60, // 15 minutes
  MAX_FAILED_LOGINS: 5,
  LOCKOUT_DURATION: 15 * 60, // 15 minutes
  CSRF_TOKEN_EXPIRY: 60 * 60, // 1 hour
};

// iOS Configuration
export const IOS_CONFIG = {
  APP_ID: 'com.axel.al',
  BUNDLE_ID: 'com.axel.al',
  DISPLAY_NAME: 'AL',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  MIN_IOS_VERSION: '15.0',
  SUPPORTS_IPAD: true,
  SUPPORTS_PORTRAIT: true,
  SUPPORTS_LANDSCAPE: true,
  REQUIRED_PERMISSIONS: [
    'microphone',
    'camera',
    'photos',
    'notifications',
    'background_fetch',
    'background_audio',
  ],
  CAPACITIES: {
    VOICE_RECOGNITION: true,
    TEXT_TO_SPEECH: true,
    PUSH_NOTIFICATIONS: true,
    FILE_SHARING: true,
    BACKGROUND_SYNC: false,
    WIDGETS: false,
  },
};

// Cloudflare Configuration
export const CLOUDFLARE_CONFIG = {
  ACCOUNT_ID: import.meta.env.CLOUDFLARE_ACCOUNT_ID || '',
  API_TOKEN: import.meta.env.CLOUDFLARE_API_TOKEN || '',
  WORKER_NAME: 'al-api',
  KV_NAMESPACE: 'al-kv',
  D1_DATABASE: 'al-db',
  R2_BUCKET: 'al-files',
  PAGES_PROJECT: 'al-web',
};

// Error Codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_TOKEN_INVALID: 'AUTH_003',
  AUTH_USER_NOT_FOUND: 'AUTH_004',
  AUTH_RATE_LIMITED: 'AUTH_005',
  AUTH_ACCOUNT_LOCKED: 'AUTH_006',

  // Validation errors
  VALIDATION_ERROR: 'VAL_001',
  VALIDATION_MISSING_FIELD: 'VAL_002',
  VALIDATION_INVALID_TYPE: 'VAL_003',
  VALIDATION_TOO_LONG: 'VAL_004',

  // Database errors
  DB_CONNECTION_ERROR: 'DB_001',
  DB_QUERY_ERROR: 'DB_002',
  DB_NOT_FOUND: 'DB_003',
  DB_DUPLICATE: 'DB_004',

  // AI Provider errors
  AI_PROVIDER_NOT_FOUND: 'AI_001',
  AI_PROVIDER_INVALID_KEY: 'AI_002',
  AI_PROVIDER_RATE_LIMITED: 'AI_003',
  AI_PROVIDER_ERROR: 'AI_004',
  AI_MODEL_NOT_FOUND: 'AI_005',
  AI_MODEL_UNAVAILABLE: 'AI_006',

  // File errors
  FILE_TOO_LARGE: 'FILE_001',
  FILE_INVALID_TYPE: 'FILE_002',
  FILE_UPLOAD_ERROR: 'FILE_003',
  FILE_NOT_FOUND: 'FILE_004',

  // Memory errors
  MEMORY_LIMIT_REACHED: 'MEM_001',
  MEMORY_INDEX_ERROR: 'MEM_002',

  // Search errors
  SEARCH_ERROR: 'SEARCH_001',
  SEARCH_NO_RESULTS: 'SEARCH_002',

  // Tool errors
  TOOL_NOT_FOUND: 'TOOL_001',
  TOOL_EXECUTION_ERROR: 'TOOL_002',
  TOOL_PERMISSION_DENIED: 'TOOL_003',

  // Rate limiting errors
  RATE_LIMITED: 'RATE_001',

  // Server errors
  INTERNAL_ERROR: 'ERR_001',
  SERVICE_UNAVAILABLE: 'ERR_002',
  NOT_IMPLEMENTED: 'ERR_003',
};

// Error Messages
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Nieprawidłowy adres e-mail lub hasło',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Sesja wygasła. Zaloguj się ponownie.',
  [ERROR_CODES.AUTH_TOKEN_INVALID]: 'Nieprawidłowy token autoryzacyjny',
  [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'Użytkownik nie istnieje',
  [ERROR_CODES.AUTH_RATE_LIMITED]: 'Zbyt wiele prób logowania. Spróbuj później.',
  [ERROR_CODES.AUTH_ACCOUNT_LOCKED]: 'Konto zostało zablokowane. Skontaktuj się z obsługą.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Błąd walidacji danych',
  [ERROR_CODES.VALIDATION_MISSING_FIELD]: 'Pole jest wymagane',
  [ERROR_CODES.VALIDATION_INVALID_TYPE]: 'Nieprawidłowy typ danych',
  [ERROR_CODES.VALIDATION_TOO_LONG]: 'Wartość jest zbyt długa',
  [ERROR_CODES.DB_CONNECTION_ERROR]: 'Błąd połączenia z bazą danych',
  [ERROR_CODES.DB_QUERY_ERROR]: 'Błąd zapytania do bazy danych',
  [ERROR_CODES.DB_NOT_FOUND]: 'Rekord nie został znaleziony',
  [ERROR_CODES.DB_DUPLICATE]: 'Rekord już istnieje',
  [ERROR_CODES.AI_PROVIDER_NOT_FOUND]: 'Dostawca AI nie został znaleziony',
  [ERROR_CODES.AI_PROVIDER_INVALID_KEY]: 'Nieprawidłowy klucz API dostawcy AI',
  [ERROR_CODES.AI_PROVIDER_RATE_LIMITED]: 'Limit wywołań API został wyczerpany',
  [ERROR_CODES.AI_PROVIDER_ERROR]: 'Błąd dostawcy AI',
  [ERROR_CODES.AI_MODEL_NOT_FOUND]: 'Model AI nie został znaleziony',
  [ERROR_CODES.AI_MODEL_UNAVAILABLE]: 'Model AI jest niedostępny',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Plik jest zbyt duży',
  [ERROR_CODES.FILE_INVALID_TYPE]: 'Nieprawidłowy typ pliku',
  [ERROR_CODES.FILE_UPLOAD_ERROR]: 'Błąd podczas przesyłania pliku',
  [ERROR_CODES.FILE_NOT_FOUND]: 'Plik nie został znaleziony',
  [ERROR_CODES.MEMORY_LIMIT_REACHED]: 'Osiągnięto limit pamięci',
  [ERROR_CODES.MEMORY_INDEX_ERROR]: 'Błąd indeksowania pamięci',
  [ERROR_CODES.SEARCH_ERROR]: 'Błąd wyszukiwania',
  [ERROR_CODES.SEARCH_NO_RESULTS]: 'Brak wyników wyszukiwania',
  [ERROR_CODES.TOOL_NOT_FOUND]: 'Narzędzie nie zostało znalezione',
  [ERROR_CODES.TOOL_EXECUTION_ERROR]: 'Błąd wykonania narzędzia',
  [ERROR_CODES.TOOL_PERMISSION_DENIED]: 'Brak uprawnień do użycia narzędzia',
  [ERROR_CODES.RATE_LIMITED]: 'Zbyt wiele żądań. Spróbuj później.',
  [ERROR_CODES.INTERNAL_ERROR]: 'Wystąpił błąd serwera',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Usługa jest niedostępna',
  [ERROR_CODES.NOT_IMPLEMENTED]: 'Funkcjonalność nie jest jeszcze zaimplementowana',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Zalogowano pomyślnie',
  REGISTER_SUCCESS: 'Rejestracja powiodła się',
  LOGOUT_SUCCESS: 'Wylogowano pomyślnie',
  PASSWORD_CHANGED: 'Hasło zostało zmienione',
  PROFILE_UPDATED: 'Profil został zaktualizowany',
  PROJECT_CREATED: 'Projekt został utworzony',
  PROJECT_UPDATED: 'Projekt został zaktualizowany',
  PROJECT_DELETED: 'Projekt został usunięty',
  TASK_CREATED: 'Zadanie zostało utworzone',
  TASK_UPDATED: 'Zadanie zostało zaktualizowane',
  TASK_DELETED: 'Zadanie zostało usunięte',
  CONVERSATION_CREATED: 'Konwersacja została utworzona',
  CONVERSATION_DELETED: 'Konwersacja została usunięta',
  MESSAGE_SENT: 'Wiadomość została wysłana',
  FILE_UPLOADED: 'Plik został przesłany',
  FILE_DELETED: 'Plik został usunięty',
  AI_PROVIDER_ADDED: 'Dostawca AI został dodany',
  AI_PROVIDER_UPDATED: 'Dostawca AI został zaktualizowany',
  AI_PROVIDER_DELETED: 'Dostawca AI został usunięty',
  MEMORY_ENTRY_ADDED: 'Wpis pamięci został dodany',
  MEMORY_ENTRY_UPDATED: 'Wpis pamięci został zaktualizowany',
  MEMORY_ENTRY_DELETED: 'Wpis pamięci został usunięty',
  INTEGRATION_ADDED: 'Integracja została dodana',
  INTEGRATION_UPDATED: 'Integracja została zaktualizowana',
  INTEGRATION_DELETED: 'Integracja została usunięta',
  REMINDER_CREATED: 'Przypomnienie zostało utworzone',
  REMINDER_DELETED: 'Przypomnienie zostało usunięte',
};

// Free Tier Information
export const FREE_TIER_INFO = {
  MISTRAL: {
    NAME: 'Mistral AI',
    FREE: true,
    REQUIRES_API_KEY: true,
    DAILY_LIMIT: '32,000 tokenów/dzień (dla nowych użytkowników)',
    RATE_LIMIT: '10 żądań/minutę',
    SUPPORTS_STREAMING: true,
    SUPPORTS_TOOLS: true,
    DOCS_URL: 'https://docs.mistral.ai',
    VERIFIED_DATE: '2024-10-01',
  },
  GROQ: {
    NAME: 'Groq',
    FREE: true,
    REQUIRES_API_KEY: true,
    DAILY_LIMIT: '30,000 tokenów/dzień',
    RATE_LIMIT: '60 żądań/minutę',
    SUPPORTS_STREAMING: true,
    SUPPORTS_TOOLS: false,
    DOCS_URL: 'https://console.groq.com/docs',
    VERIFIED_DATE: '2024-10-01',
  },
  OPENROUTER: {
    NAME: 'OpenRouter',
    FREE: true,
    REQUIRES_API_KEY: true,
    DAILY_LIMIT: '$0.01 kredytu na start',
    RATE_LIMIT: '60 żądań/minutę',
    SUPPORTS_STREAMING: true,
    SUPPORTS_TOOLS: false,
    DOCS_URL: 'https://openrouter.ai/docs',
    VERIFIED_DATE: '2024-10-01',
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  // Core features
  AUTHENTICATION: true,
  CHAT: true,
  PROJECTS: true,
  TASKS: true,
  MEMORY: true,
  FILES: true,
  SEARCH: true,

  // AI Features
  AI_CHAT: true,
  AI_STREAMING: true,
  AI_TOOLS: false, // Not yet implemented
  AI_MEMORY: true,

  // Voice Features
  VOICE_STT: false, // Requires native integration
  VOICE_TTS: false, // Requires native integration

  // Integration Features
  INTEGRATIONS_GITHUB: false,
  INTEGRATIONS_CLOUDFLARE: false,
  INTEGRATIONS_NOTION: false,

  // Advanced Features
  REMINDERS: false,
  NOTIFICATIONS: false,
  WIDGETS: false,
  OFFLINE_MODE: false,

  // iOS Features
  IOS_NATIVE: false,
  IOS_VOICE: false,
  IOS_NOTIFICATIONS: false,
  IOS_FILE_SHARING: false,
};

// Implementation Status
export const IMPLEMENTATION_STATUS = {
  DONE: 'DONE',
  PARTIAL: 'PARTIAL',
  BLOCKED: 'BLOCKED',
  NOT_STARTED: 'NOT_STARTED',
};

// Current implementation status for major features
export const CURRENT_STATUS = {
  AUTHENTICATION: IMPLEMENTATION_STATUS.PARTIAL,
  CHAT: IMPLEMENTATION_STATUS.PARTIAL,
  PROJECTS: IMPLEMENTATION_STATUS.NOT_STARTED,
  TASKS: IMPLEMENTATION_STATUS.NOT_STARTED,
  MEMORY: IMPLEMENTATION_STATUS.NOT_STARTED,
  FILES: IMPLEMENTATION_STATUS.NOT_STARTED,
  SEARCH: IMPLEMENTATION_STATUS.NOT_STARTED,
  AI_INTEGRATION: IMPLEMENTATION_STATUS.NOT_STARTED,
  VOICE: IMPLEMENTATION_STATUS.NOT_STARTED,
  INTEGRATIONS: IMPLEMENTATION_STATUS.NOT_STARTED,
  IOS: IMPLEMENTATION_STATUS.NOT_STARTED,
};
