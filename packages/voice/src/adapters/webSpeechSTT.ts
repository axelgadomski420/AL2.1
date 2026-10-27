/**
 * Web Speech API STT Adapter
 * Uses browser's built-in SpeechRecognition API
 */

import {
  STTOptions,
  STTResult,
  WebSpeechSTTAdapter,
} from '../types';

export class WebSpeechSTTAdapterImpl implements WebSpeechSTTAdapter {
  private recognition: SpeechRecognition | null = null;
  private finalTranscript: string = '';
  private interimTranscript: string = '';
  private isListening: boolean = false;
  private isProcessing: boolean = false;
  private options: STTOptions = {};
  private onResultCallback: ((result: STTResult) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - SpeechRecognition may not be in global scope
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'pl-PL';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.isProcessing = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.isProcessing = false;
          this.onEndCallback?.();
        };

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          this.interimTranscript = '';
          let finalText = '';
          let isFinal = false;
          let confidenceValue: number | undefined;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            confidenceValue = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
              finalText += transcript + ' ';
              isFinal = true;
            } else {
              this.interimTranscript += transcript;
            }
          }

          if (finalText) {
            this.finalTranscript += finalText;
          }

          if (this.interimTranscript && this.onResultCallback) {
            this.onResultCallback({
              text: this.finalTranscript + this.interimTranscript,
              confidence: confidenceValue,
              isFinal: false,
              language: this.recognition?.lang || 'pl-PL',
            });
          }

          if (isFinal && this.onResultCallback) {
            this.onResultCallback({
              text: this.finalTranscript.trim(),
              confidence: confidenceValue,
              isFinal: true,
              language: this.recognition?.lang || 'pl-PL',
            });
          }
        };

        this.recognition.onerror = (event: Event) => {
          this.isListening = false;
          this.isProcessing = false;
          const errorEvent = event as { error?: string };
          const errorMessage = this.getErrorMessage(errorEvent.error || '');
          this.onErrorCallback?.(errorMessage);
        };
      }
    }
  }

  private getErrorMessage(error: string): string {
    const messages: Record<string, string> = {
      'no-speech': 'Nie wykryto mowy. Sprobuj ponownie.',
      'audio-capture': 'Brak dostępu do mikrofonu. Sprawdź uprawnienia.',
      'not-allowed': 'Dostęp do mikrofonu został zablokowany. Zezwól na dostęp w ustawieniach przeglądarki.',
      'aborted': 'Rozpoznawanie zostało przerwane.',
      'network': 'Błąd sieci. Sprawdź połączenie internetowe.',
      'service-not-allowed': 'Usługa rozpoznawania mowy nie jest dostępna.',
      'language-not-supported': 'Język nie jest obsługiwany.',
    };
    return messages[error] || `Błąd rozpoznawania mowy: ${error}`;
  }

  async start(options?: STTOptions): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech Recognition API nie jest dostępne');
    }

    this.options = { ...this.options, ...options };
    this.finalTranscript = '';
    this.interimTranscript = '';

    if (this.options.language) {
      this.recognition.lang = this.options.language;
    }
    if (this.options.continuous !== undefined) {
      this.recognition.continuous = this.options.continuous;
    }
    if (this.options.interimResults !== undefined) {
      this.recognition.interimResults = this.options.interimResults;
    }

    return new Promise((resolve, reject) => {
      this.onEndCallback = resolve;
      this.onErrorCallback = reject;
      
      try {
        this.recognition?.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<string | null> {
    if (!this.recognition) {
      return null;
    }

    return new Promise((resolve) => {
      this.onEndCallback = () => {
        resolve(this.finalTranscript.trim() || null);
      };
      
      this.recognition?.stop();
    });
  }

  cancel(): void {
    this.recognition?.abort();
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.isListening = false;
    this.isProcessing = false;
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    // @ts-expect-error - SpeechRecognition may not be in global scope
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  getStatus(): 'idle' | 'listening' | 'processing' {
    if (this.isListening) return 'listening';
    if (this.isProcessing) return 'processing';
    return 'idle';
  }

  setOnResult(callback: (result: STTResult) => void): void {
    this.onResultCallback = callback;
  }

  setOnEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }
}

// Singleton instance
export const webSpeechSTTAdapter = new WebSpeechSTTAdapterImpl();
