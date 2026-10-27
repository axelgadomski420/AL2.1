/**
 * Audio Recording Adapter
 * Uses MediaRecorder API for recording audio
 */

import {
  RecordingOptions,
  RecordingState,
} from '../types';

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioStream: MediaStream | null = null;
  private startTime: number = 0;
  private options: RecordingOptions = {};
  private onDataCallback: ((chunk: Blob) => void) | null = null;
  private onStopCallback: ((blob: Blob) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(options?: RecordingOptions) {
    this.options = {
      mimeType: 'audio/webm;codecs=opus',
      sampleRate: 44100,
      channelCount: 1,
      ...options,
    };
  }

  async start(): Promise<void> {
    try {
      // Check if we already have a stream
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        return;
      }

      // Get audio stream
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.options.echoCancellation ?? true,
          noiseSuppression: this.options.noiseSuppression ?? true,
          autoGainControl: this.options.autoGainControl ?? true,
          channelCount: this.options.channelCount,
          sampleRate: this.options.sampleRate,
        },
        video: false,
      });

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: this.options.mimeType,
      });

      this.audioChunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.onDataCallback?.(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, {
          type: this.options.mimeType || 'audio/webm',
        });
        this.onStopCallback?.(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        const error = (event as any).error || new Error('Recording error');
        this.onErrorCallback?.(error.message);
      };

      this.mediaRecorder.start(1000); // Collect data every 1 second
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.onErrorCallback?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.onStopCallback = resolve;
      
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        const blob = new Blob(this.audioChunks, {
          type: this.options.mimeType || 'audio/webm',
        });
        resolve(blob);
      }
    });
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  cancel(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.startTime = 0;
  }

  getState(): RecordingState {
    const duration = this.mediaRecorder && this.mediaRecorder.state !== 'inactive'
      ? (Date.now() - this.startTime) / 1000
      : 0;

    return {
      isRecording: this.mediaRecorder?.state === 'recording',
      audioChunks: this.audioChunks,
      duration,
      sampleRate: this.options.sampleRate || 44100,
      mimeType: this.options.mimeType || 'audio/webm',
    };
  }

  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return 'Dostęp do mikrofonu został zablokowany. Zezwól na dostęp w ustawieniach przeglądarki.';
      }
      if (error.name === 'NotFoundError') {
        return 'Nie znaleziono urządzenia audio.';
      }
      if (error.name === 'NotReadableError') {
        return 'Mikrofon jest zajęty przez inną aplikację.';
      }
      return error.message;
    }
    return `Błąd nagrywania: ${error}`;
  }

  isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined' && 
           typeof navigator !== 'undefined' &&
           'mediaDevices' in navigator;
  }

  setOnData(callback: (chunk: Blob) => void): void {
    this.onDataCallback = callback;
  }

  setOnStop(callback: (blob: Blob) => void): void {
    this.onStopCallback = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }
}
