/**
 * Voice Service
 * Main service for managing voice functionality
 * Implements the VoiceService interface
 */

import {
  VoiceService,
  VoiceStatus,
  VoiceError,
  VoiceConfig,
  VoiceEventMap,
  VoiceEventListener,
  RecordingOptions,
  RecordingState,
  STTOptions,
  STTResult,
  TTSOptions,
  TTSSynthesis,
  PlaybackState,
  VoiceProvider,
} from './types';

import {
  AudioRecorder,
} from './adapters/audioRecorder';

import {
  AudioPlayer,
} from './adapters/audioPlayer';

import {
  webSpeechSTTAdapter,
} from './adapters/webSpeechSTT';

import {
  webSpeechTTSAdapter,
} from './adapters/webSpeechTTS';

import {
  VOICE_PROVIDERS,
  DEFAULT_VOICE_CONFIG,
} from './providers';

export class VoiceServiceImpl implements VoiceService {
  private status: VoiceStatus = 'idle';
  private error: VoiceError | null = null;
  private config: VoiceConfig;
  private eventListeners: Map<keyof VoiceEventMap, Set<VoiceEventListener<any>>> = new Map();

  // Adapters
  private audioRecorder: AudioRecorder;
  private audioPlayer: AudioPlayer;

  // Recording state
  private recordingBlob: Blob | null = null;

  constructor() {
    this.config = { ...DEFAULT_VOICE_CONFIG };
    this.audioRecorder = new AudioRecorder();
    this.audioPlayer = new AudioPlayer();
    this.setupAdapterListeners();
  }

  private setupAdapterListeners(): void {
    // Audio Recorder listeners
    this.audioRecorder.setOnData((chunk) => {
      this.emit('recording-data', chunk);
    });

    this.audioRecorder.setOnStop((blob) => {
      this.recordingBlob = blob;
      this.emit('recording-stop', blob);
    });

    this.audioRecorder.setOnError((error) => {
      this.setError('audio_error', error);
    });

    // STT Adapter listeners
    webSpeechSTTAdapter.setOnResult((result) => {
      this.emit('stt-result', result);
    });

    webSpeechSTTAdapter.setOnEnd(() => {
      this.emit('stt-complete', this.recordingBlob ? 'STT complete' : '');
    });

    webSpeechSTTAdapter.setOnError((error) => {
      this.setError('audio_error', error);
    });

    // TTS Adapter listeners
    webSpeechTTSAdapter.onEndCallback = () => {
      this.emit('tts-complete', { audio: new Blob(), mimeType: '', duration: 0 });
    };

    webSpeechTTSAdapter.onErrorCallback = (error) => {
      this.setError('api_error', error);
    };

    // Audio Player listeners
    this.audioPlayer.setOnEnd(() => {
      this.emit('playback-end');
      this.setStatus('idle');
    });

    this.audioPlayer.setOnPause(() => {
      this.emit('playback-pause');
      this.setStatus('paused');
    });

    this.audioPlayer.setOnResume(() => {
      this.emit('playback-resume');
      this.setStatus('playing');
    });

    this.audioPlayer.setOnTimeUpdate((time) => {
      this.emit('playback-timeupdate', time);
    });
  }

  // ==================== Status and Configuration ====================

  getStatus(): VoiceStatus {
    return this.status;
  }

  getError(): VoiceError | null {
    return this.error;
  }

  isAvailable(): boolean {
    // Check if any STT or TTS is available
    const hasSTT = webSpeechSTTAdapter.isSupported();
    const hasTTS = webSpeechTTSAdapter.isSupported();
    return hasSTT || hasTTS;
  }

  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  configure(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getProviders(): VoiceProvider[] {
    return VOICE_PROVIDERS.map(provider => ({
      ...provider,
      // Update availability based on runtime checks
      stt: {
        ...provider.stt,
        available: provider.stt.available && this.checkSTTAvailability(provider.name),
      },
      tts: {
        ...provider.tts,
        available: provider.tts.available && this.checkTTSAvailability(provider.name),
      },
    }));
  }

  async setProvider(providerName: string): Promise<boolean> {
    const provider = VOICE_PROVIDERS.find(p => p.name === providerName);
    if (!provider) {
      return false;
    }

    // Check if provider is available
    const sttAvailable = this.checkSTTAvailability(providerName);
    const ttsAvailable = this.checkTTSAvailability(providerName);

    if (!sttAvailable && !ttsAvailable) {
      return false;
    }

    this.config.preferredProvider = providerName;
    this.config.stt.provider = sttAvailable ? providerName : 'web-speech-api';
    this.config.tts.provider = ttsAvailable ? providerName : 'web-speech-api';

    return true;
  }

  private checkSTTAvailability(providerName: string): boolean {
    if (providerName === 'web-speech-api') {
      return webSpeechSTTAdapter.isSupported();
    }
    // For other providers, check if they're configured
    return true;
  }

  private checkTTSAvailability(providerName: string): boolean {
    if (providerName === 'web-speech-api') {
      return webSpeechTTSAdapter.isSupported();
    }
    return true;
  }

  // ==================== Status Management ====================

  private setStatus(status: VoiceStatus): void {
    this.status = status;
    this.emit('status-change', status);
  }

  private setError(type: VoiceError['type'], message: string): void {
    this.error = { type, message };
    this.emit('error', this.error);
    this.setStatus('error');
  }

  private clearError(): void {
    this.error = null;
  }

  // ==================== Recording ====================

  async startRecording(options?: RecordingOptions): Promise<Blob | null> {
    if (this.status !== 'idle') {
      this.setError('audio_error', 'Voice service is busy');
      return null;
    }

    if (!this.audioRecorder.isSupported()) {
      this.setError('unsupported', 'Audio recording is not supported in this browser');
      return null;
    }

    this.setStatus('listening');
    this.clearError();

    try {
      await this.audioRecorder.start();
      this.emit('recording-start');
      return null; // Return null, blob will be available on stop
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setError('permission_denied', errorMessage);
      this.setStatus('idle');
      return null;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (this.status !== 'listening') {
      return null;
    }

    try {
      const blob = await this.audioRecorder.stop();
      this.recordingBlob = blob;
      this.emit('recording-stop', blob);
      this.setStatus('idle');
      return blob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setError('audio_error', errorMessage);
      return null;
    }
  }

  cancelRecording(): void {
    this.audioRecorder.cancel();
    this.recordingBlob = null;
    this.setStatus('idle');
  }

  getRecordingState(): RecordingState {
    return this.audioRecorder.getState();
  }

  // ==================== STT ====================

  async transcribe(audio: Blob, options?: STTOptions): Promise<string> {
    this.setStatus('processing');
    this.clearError();

    try {
      // For now, use Web Speech API for STT
      // In production, this would use the configured provider
      const provider = this.config.stt.provider || 'web-speech-api';

      if (provider === 'web-speech-api') {
        // Web Speech API doesn't support direct audio blob transcription
        // We need to use the recording approach
        throw new Error('Web Speech API requires real-time recording for STT');
      }

      // For other providers, we would send the audio to their API
      // This is a placeholder for future implementation
      this.setError('unsupported', 'STT with audio blob is not yet implemented for this provider');
      return '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setError('api_error', errorMessage);
      this.setStatus('idle');
      return '';
    }
  }

  async startSTT(options?: STTOptions): Promise<void> {
    if (this.status !== 'idle') {
      throw new Error('Voice service is busy');
    }

    if (!webSpeechSTTAdapter.isSupported()) {
      throw new Error('STT is not supported');
    }

    this.setStatus('listening');
    this.clearError();

    const mergedOptions: STTOptions = {
      language: this.config.stt.language,
      continuous: this.config.stt.continuous,
      interimResults: this.config.stt.interimResults,
      ...options,
    };

    return webSpeechSTTAdapter.start(mergedOptions);
  }

  async stopSTT(): Promise<string | null> {
    if (this.status !== 'listening') {
      return null;
    }

    return webSpeechSTTAdapter.stop();
  }

  // ==================== TTS ====================

  async synthesize(text: string, options?: TTSOptions): Promise<TTSSynthesis | null> {
    if (!webSpeechTTSAdapter.isSupported()) {
      this.setError('unsupported', 'TTS is not supported');
      return null;
    }

    this.setStatus('processing');
    this.clearError();

    // Note: Web Speech API doesn't provide the audio blob directly
    // This is a limitation we need to work around
    // For now, we'll just speak and return a mock synthesis
    
    const mergedOptions: TTSOptions = {
      voice: this.config.tts.voice,
      rate: this.config.tts.rate,
      pitch: this.config.tts.pitch,
      volume: this.config.tts.volume,
      language: this.config.tts.language || 'pl-PL',
      ...options,
    };

    try {
      // For actual audio generation, we'd need a different approach
      // This is a placeholder
      this.setError('unsupported', 'Audio synthesis is not available with Web Speech API. Use speak() for direct playback.');
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setError('api_error', errorMessage);
      this.setStatus('idle');
      return null;
    }
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    if (this.status !== 'idle' && this.status !== 'paused') {
      // Stop current speech
      this.stopSpeaking();
    }

    if (!webSpeechTTSAdapter.isSupported()) {
      throw new Error('TTS is not supported');
    }

    this.setStatus('speaking');
    this.clearError();

    const mergedOptions: TTSOptions = {
      voice: this.config.tts.voice,
      rate: this.config.tts.rate,
      pitch: this.config.tts.pitch,
      volume: this.config.tts.volume,
      language: this.config.tts.language || 'pl-PL',
      ...options,
    };

    this.emit('tts-start');

    return webSpeechTTSAdapter.speak(text, mergedOptions);
  }

  stopSpeaking(): void {
    webSpeechTTSAdapter.cancel();
    this.setStatus('idle');
  }

  // ==================== Playback ====================

  async play(audio: Blob | ArrayBuffer, mimeType?: string): Promise<void> {
    if (!this.audioPlayer.isSupported()) {
      throw new Error('Audio playback is not supported');
    }

    this.setStatus('playing');
    this.clearError();

    this.emit('playback-start');

    return this.audioPlayer.play(audio, mimeType);
  }

  pause(): void {
    this.audioPlayer.pause();
  }

  resume(): void {
    this.audioPlayer.resume();
  }

  stop(): void {
    this.audioPlayer.stop();
    this.setStatus('idle');
  }

  getPlaybackState(): PlaybackState {
    return this.audioPlayer.getState();
  }

  // ==================== Events ====================

  private emit<T extends keyof VoiceEventMap>(event: T, data: VoiceEventMap[T]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${String(event)}:`, error);
        }
      });
    }
  }

  on<T extends keyof VoiceEventMap>(
    event: T,
    listener: VoiceEventListener<T>
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off<T extends keyof VoiceEventMap>(
    event: T,
    listener: VoiceEventListener<T>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  once<T extends keyof VoiceEventMap>(
    event: T,
    listener: VoiceEventListener<T>
  ): void {
    const onceListener: VoiceEventListener<T> = (data) => {
      listener(data);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }

  // ==================== Cleanup ====================

  destroy(): void {
    this.audioRecorder.cancel();
    this.audioPlayer.destroy();
    webSpeechSTTAdapter.cancel();
    webSpeechTTSAdapter.cancel();
    this.eventListeners.clear();
  }
}

// Singleton instance
export const voiceService = new VoiceServiceImpl();
