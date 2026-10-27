// Voice types for AL Assistant

export type VoiceStatus = 
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'playing'
  | 'paused'
  | 'error';

export type VoiceErrorType = 
  | 'permission_denied'
  | 'no_speech'
  | 'audio_error'
  | 'network_error'
  | 'api_error'
  | 'unsupported'
  | 'timeout';

export interface VoiceError {
  type: VoiceErrorType;
  message: string;
  code?: string;
  details?: any;
}

export interface RecordingOptions {
  mimeType?: string;
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  audioChunks: Blob[];
  duration: number;
  sampleRate: number;
  mimeType: string;
}

export interface STTResult {
  text: string;
  confidence?: number;
  isFinal: boolean;
  language?: string;
  speaker?: string;
}

export interface STTOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export interface TTSSynthesis {
  audio: Blob | ArrayBuffer;
  mimeType: string;
  duration: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface VoiceAdapterConfig {
  name: string;
  type: 'web' | 'native' | 'api';
  isAvailable: boolean;
  priority: number;
}

export interface VoiceProvider {
  name: string;
  displayName: string;
  stt: {
    available: boolean;
    requiresKey: boolean;
    freeTier: boolean;
    limits?: {
      requestsPerMinute?: number;
      requestsPerDay?: number;
      durationPerRequest?: number; // seconds
    };
  };
  tts: {
    available: boolean;
    requiresKey: boolean;
    freeTier: boolean;
    voices?: string[];
    limits?: {
      charactersPerRequest?: number;
      requestsPerMinute?: number;
    };
  };
}

export interface VoiceConfig {
  enabled: boolean;
  preferredProvider?: string;
  stt: {
    provider: string;
    language: string;
    continuous: boolean;
    interimResults: boolean;
  };
  tts: {
    provider: string;
    voice: string;
    rate: number;
    pitch: number;
    volume: number;
    language?: string;
  };
  playback: {
    volume: number;
    autoPlay: boolean;
  };
}

export interface VoiceEventMap {
  'status-change': VoiceStatus;
  'error': VoiceError;
  'recording-start': void;
  'recording-stop': Blob;
  'recording-data': Blob;
  'stt-result': STTResult;
  'stt-complete': string;
  'tts-start': void;
  'tts-complete': TTSSynthesis;
  'playback-start': void;
  'playback-end': void;
  'playback-pause': void;
  'playback-resume': void;
  'playback-timeupdate': number;
}

export type VoiceEventListener<T extends keyof VoiceEventMap> = (
  event: VoiceEventMap[T]
) => void;

export interface VoiceService {
  // Status
  getStatus: () => VoiceStatus;
  getError: () => VoiceError | null;
  isAvailable: () => boolean;
  getConfig: () => VoiceConfig;
  
  // Configuration
  configure: (config: Partial<VoiceConfig>) => void;
  setProvider: (providerName: string) => Promise<boolean>;
  getProviders: () => VoiceProvider[];
  
  // Recording
  startRecording: (options?: RecordingOptions) => Promise<Blob | null>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  getRecordingState: () => RecordingState;
  
  // STT
  transcribe: (audio: Blob, options?: STTOptions) => Promise<string>;
  startSTT: (options?: STTOptions) => Promise<void>;
  stopSTT: () => Promise<string | null>;
  
  // TTS
  synthesize: (text: string, options?: TTSOptions) => Promise<TTSSynthesis | null>;
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stopSpeaking: () => void;
  
  // Playback
  play: (audio: Blob | ArrayBuffer, mimeType?: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  getPlaybackState: () => PlaybackState;
  
  // Events
  on: <T extends keyof VoiceEventMap>(
    event: T,
    listener: VoiceEventListener<T>
  ) => void;
  off: <T extends keyof VoiceEventMap>(
    event: T,
    listener: VoiceEventListener<T>
  ) => void;
  once: <T extends keyof VoiceEventMap>(
    event: T,
    listener: VoiceEventListener<T>
  ) => void;
  
  // Cleanup
  destroy: () => void;
}

export interface WebSpeechSTTAdapter {
  start: (options?: STTOptions) => Promise<void>;
  stop: () => Promise<string | null>;
  cancel: () => void;
  isSupported: () => boolean;
  getStatus: () => 'idle' | 'listening' | 'processing';
}

export interface WebSpeechTTSAdapter {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isSupported: () => boolean;
  getVoices: () => SpeechSynthesisVoice[];
  getStatus: () => 'idle' | 'speaking' | 'paused';
}

export interface NativeSTTAdapter {
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  isSupported: () => boolean;
}

export interface NativeTTSAdapter {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  isSupported: () => boolean;
}
