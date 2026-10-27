/**
 * Voice Providers Configuration
 * Defines available STT and TTS providers with their capabilities and limits
 */

import { VoiceProvider } from './types';

export const VOICE_PROVIDERS: VoiceProvider[] = [
  {
    name: 'web-speech-api',
    displayName: 'Web Speech API (Przeglądarka)',
    stt: {
      available: true,
      requiresKey: false,
      freeTier: true,
      limits: {
        requestsPerMinute: 100,
        durationPerRequest: 60, // seconds
      },
    },
    tts: {
      available: true,
      requiresKey: false,
      freeTier: true,
      voices: [], // Will be populated from browser
      limits: {
        charactersPerRequest: 10000,
        requestsPerMinute: 100,
      },
    },
  },
  {
    name: 'groq',
    displayName: 'Groq',
    stt: {
      available: true,
      requiresKey: true,
      freeTier: true,
      limits: {
        requestsPerMinute: 30,
        requestsPerDay: 14400,
        durationPerRequest: 300,
      },
    },
    tts: {
      available: false,
      requiresKey: true,
      freeTier: false,
    },
  },
  {
    name: 'mistral',
    displayName: 'Mistral',
    stt: {
      available: false,
      requiresKey: true,
      freeTier: false,
    },
    tts: {
      available: false,
      requiresKey: true,
      freeTier: false,
    },
  },
  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    stt: {
      available: true,
      requiresKey: true,
      freeTier: true,
      limits: {
        requestsPerMinute: 20,
        requestsPerDay: 50,
        durationPerRequest: 300,
      },
    },
    tts: {
      available: true,
      requiresKey: true,
      freeTier: true,
      limits: {
        charactersPerRequest: 5000,
        requestsPerMinute: 20,
      },
    },
  },
  {
    name: 'native-ios',
    displayName: 'iOS Native',
    stt: {
      available: false, // Will be detected at runtime
      requiresKey: false,
      freeTier: true,
      limits: {
        durationPerRequest: 60,
      },
    },
    tts: {
      available: false, // Will be detected at runtime
      requiresKey: false,
      freeTier: true,
      voices: [], // Will be populated from device
    },
  },
];

// Default configuration
export const DEFAULT_VOICE_CONFIG = {
  enabled: true,
  preferredProvider: 'web-speech-api',
  stt: {
    provider: 'web-speech-api',
    language: 'pl-PL',
    continuous: false,
    interimResults: true,
  },
  tts: {
    provider: 'web-speech-api',
    voice: '',
    rate: 1,
    pitch: 1,
    volume: 1,
  },
  playback: {
    volume: 1,
    autoPlay: false,
  },
};

// Get free providers (STT)
export function getFreeSTTProviders(): VoiceProvider[] {
  return VOICE_PROVIDERS.filter(
    (p) => p.stt.available && p.stt.freeTier && !p.stt.requiresKey
  );
}

// Get free providers (TTS)
export function getFreeTTSProviders(): VoiceProvider[] {
  return VOICE_PROVIDERS.filter(
    (p) => p.tts.available && p.tts.freeTier && !p.tts.requiresKey
  );
}

// Check if provider requires API key
export function providerRequiresKey(providerName: string, type: 'stt' | 'tts'): boolean {
  const provider = VOICE_PROVIDERS.find(p => p.name === providerName);
  return provider?.[type]?.requiresKey || false;
}

// Get provider by name
export function getProvider(providerName: string): VoiceProvider | undefined {
  return VOICE_PROVIDERS.find(p => p.name === providerName);
}
