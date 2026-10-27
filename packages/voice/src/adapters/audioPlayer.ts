/**
 * Audio Playback Adapter
 * Uses HTMLAudioElement for audio playback
 */

import {
  PlaybackState,
} from '../types';

export class AudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private volume: number = 1;
  private onEndCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onResumeCallback: (() => void) | null = null;
  private onTimeUpdateCallback: ((time: number) => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.audioElement = new Audio();
    this.audioElement.volume = this.volume;

    this.audioElement.onended = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.onEndCallback?.();
    };

    this.audioElement.onpause = () => {
      this.isPaused = true;
      this.onPauseCallback?.();
    };

    this.audioElement.onplay = () => {
      this.isPlaying = true;
      this.isPaused = false;
    };

    this.audioElement.onplaying = () => {
      this.isPlaying = true;
      this.isPaused = false;
    };

    this.audioElement.onresume = () => {
      this.isPaused = false;
      this.onResumeCallback?.();
    };

    this.audioElement.ontimeupdate = () => {
      if (this.audioElement) {
        this.onTimeUpdateCallback?.(this.audioElement.currentTime);
      }
    };
  }

  async play(audio: Blob | ArrayBuffer, mimeType?: string): Promise<void> {
    if (!this.audioElement) {
      throw new Error('Audio element not initialized');
    }

    // Stop any current playback
    this.stop();

    return new Promise((resolve, reject) => {
      const playAudio = () => {
        try {
          // Create object URL for Blob
          if (audio instanceof Blob) {
            const url = URL.createObjectURL(audio);
            this.audioElement!.src = url;
          } else {
            // ArrayBuffer - create blob URL
            const blob = new Blob([audio], { type: mimeType || 'audio/wav' });
            const url = URL.createObjectURL(blob);
            this.audioElement!.src = url;
          }

          this.audioElement!.load();
          
          // Set up ended handler
          const onEnded = () => {
            this.audioElement!.onended = null;
            resolve();
          };
          this.audioElement!.onended = onEnded;

          // Play
          const playPromise = this.audioElement!.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              resolve();
            }).catch((error) => {
              reject(error);
            });
          } else {
            // Older browsers
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      };

      playAudio();
    });
  }

  pause(): void {
    if (this.audioElement && !this.isPaused) {
      this.audioElement.pause();
    }
  }

  resume(): void {
    if (this.audioElement && this.isPaused) {
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(console.error);
      }
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
      this.isPaused = false;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  getState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentTime: this.audioElement?.currentTime || 0,
      duration: this.audioElement?.duration || 0,
      volume: this.volume,
    };
  }

  isSupported(): boolean {
    return typeof Audio !== 'undefined';
  }

  setOnEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  setOnPause(callback: () => void): void {
    this.onPauseCallback = callback;
  }

  setOnResume(callback: () => void): void {
    this.onResumeCallback = callback;
  }

  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdateCallback = callback;
  }

  destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }
}
