/**
 * Web Speech API TTS Adapter
 * Uses browser's built-in SpeechSynthesis API
 */

import {
  TTSOptions,
  TTSSynthesis,
  WebSpeechTTSAdapter,
} from '../types';

export class WebSpeechTTSAdapterImpl implements WebSpeechTTSAdapter {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  onEndCallback: (() => void) | null = null;
  onErrorCallback: ((error: string) => void) | null = null;

  isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return 'speechSynthesis' in window;
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined') {
      return [];
    }
    return window.speechSynthesis.getVoices();
  }

  getStatus(): 'idle' | 'speaking' | 'paused' {
    if (this.isPaused) return 'paused';
    if (this.isSpeaking) return 'speaking';
    return 'idle';
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Speech Synthesis API nie jest dostępne');
    }

    return new Promise((resolve, reject) => {
      // Wait for voices to be loaded
      const loadVoices = () => {
        if (window.speechSynthesis.getVoices().length > 0) {
          this.doSpeak(text, options || {}, resolve, reject);
        } else {
          // @ts-expect-error - onvoiceschanged may not exist on speechSynthesis
          window.speechSynthesis.onvoiceschanged = () => {
            this.doSpeak(text, options || {}, resolve, reject);
          };
        }
      };

      loadVoices();
    });
  }

  private doSpeak(
    text: string,
    options: TTSOptions,
    resolve: () => void,
    reject: (error: string) => void
  ): void {
    if (!this.isSupported()) {
      reject('Speech Synthesis API nie jest dostępne');
      return;
    }

    // Cancel any ongoing speech
    this.cancel();

    const voices = window.speechSynthesis.getVoices();
    
    // Try to find Polish voice, fall back to any voice
    let voice: SpeechSynthesisVoice | null = null;
    if (options.voice) {
      voice = voices.find(v => v.name === options.voice) || null;
    }
    if (!voice && options.language) {
      voice = voices.find(v => v.lang.startsWith(options.language)) || null;
    }
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith('pl')) || voices[0] || null;
    }

    this.utterance = new SpeechSynthesisUtterance(text);
    if (voice) this.utterance.voice = voice;
    this.utterance.rate = options.rate || 1;
    this.utterance.pitch = options.pitch || 1;
    this.utterance.volume = options.volume || 1;
    this.utterance.lang = options.language || 'pl-PL';

    this.utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
    };

    this.utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.utterance = null;
      this.onEndCallback?.();
      resolve();
    };

    this.utterance.onerror = (event: Event) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.utterance = null;
      const errorEvent = event as { error?: string };
      const errorMessage = `Błąd syntezy mowy: ${errorEvent.error || 'unknown'}`;
      this.onErrorCallback?.(errorMessage);
      reject(errorMessage);
    };

    this.utterance.onpause = () => {
      this.isPaused = true;
    };

    this.utterance.onresume = () => {
      this.isPaused = false;
    };

    try {
      window.speechSynthesis.speak(this.utterance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      reject(errorMessage);
    }
  }

  cancel(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.utterance = null;
    }
  }

  pause(): void {
    if (this.isSupported() && this.isSpeaking) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  resume(): void {
    if (this.isSupported() && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }
}

// Singleton instance
export const webSpeechTTSAdapter = new WebSpeechTTSAdapterImpl();
