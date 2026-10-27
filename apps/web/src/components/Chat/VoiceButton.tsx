import { useState, useEffect, useRef, useCallback } from 'react';
import { voiceService, VoiceStatus, VoiceErrorType } from '@al/voice';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VoiceButton = ({
  onTranscript,
  onError,
  disabled = false,
  size = 'md',
  className = '',
}: VoiceButtonProps) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if voice is supported
  useEffect(() => {
    setIsSupported(voiceService.isAvailable());
  }, []);

  // Listen to voice service status changes
  useEffect(() => {
    const handleStatusChange = (newStatus: VoiceStatus) => {
      setStatus(newStatus);
      if (newStatus === 'listening') {
        setIsListening(true);
        setError(null);
      } else if (newStatus === 'idle' || newStatus === 'error') {
        setIsListening(false);
      }
    };

    const handleError = (err: { type: VoiceErrorType; message: string }) => {
      setError(err.message);
      setIsListening(false);
      onError?.(err.message);
    };

    const handleSTTResult = (result: { text: string; isFinal: boolean }) => {
      if (result.isFinal && result.text.trim()) {
        onTranscript(result.text.trim());
      }
    };

    voiceService.on('status-change', handleStatusChange);
    voiceService.on('error', handleError);
    voiceService.on('stt-result', handleSTTResult);

    return () => {
      voiceService.off('status-change', handleStatusChange);
      voiceService.off('error', handleError);
      voiceService.off('stt-result', handleSTTResult);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onTranscript, onError]);

  // Handle button click
  const handleClick = useCallback(async () => {
    if (disabled || !isSupported || status === 'listening' || status === 'speaking') {
      return;
    }

    setError(null);

    try {
      if (status === 'idle') {
        // Start listening
        await voiceService.startSTT({
          language: 'pl-PL',
          continuous: false,
          interimResults: true,
        });
      } else {
        // Stop listening
        await voiceService.stopSTT();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [disabled, isSupported, status, onError]);

  // Handle mouse enter/leave for tooltip
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const show = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowTooltip(true), 300);
    };

    const hide = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setShowTooltip(false);
    };

    button.addEventListener('mouseenter', show);
    button.addEventListener('mouseleave', hide);
    button.addEventListener('focus', show);
    button.addEventListener('blur', hide);

    return () => {
      button.removeEventListener('mouseenter', show);
      button.removeEventListener('mouseleave', hide);
      button.removeEventListener('focus', show);
      button.removeEventListener('blur', hide);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Get button size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-xl';
      default:
        return 'w-10 h-10';
    }
  };

  // Get icon based on status
  const getIcon = () => {
    if (!isSupported) {
      return '⚠️';
    }
    if (status === 'listening' || isListening) {
      return '🎤';
    }
    if (status === 'processing') {
      return '⏳';
    }
    if (status === 'speaking') {
      return '🔊';
    }
    if (status === 'error') {
      return '❌';
    }
    return '🎤';
  };

  // Get button color based on status
  const getColorClasses = () => {
    if (!isSupported) {
      return 'bg-gray-600 text-gray-400 cursor-not-allowed';
    }
    if (status === 'listening' || isListening) {
      return 'bg-red-600 text-white animate-pulse';
    }
    if (status === 'error') {
      return 'bg-red-500 text-white';
    }
    if (disabled) {
      return 'bg-primary-700 text-primary-400 cursor-not-allowed';
    }
    return 'bg-primary-800 text-primary-300 hover:bg-primary-700 hover:text-white';
  };

  // Get tooltip text
  const getTooltipText = (): string => {
    if (!isSupported) {
      return 'Głos nie jest obsługiwany w tej przeglądarce';
    }
    if (status === 'listening' || isListening) {
      return 'Słucham... Kliknij, aby zatrzymać';
    }
    if (status === 'processing') {
      return 'Przetwarzanie...';
    }
    if (status === 'speaking') {
      return 'Mówię...';
    }
    if (status === 'error') {
      return error || 'Błąd głosu';
    }
    if (disabled) {
      return 'Głos niedostępny';
    }
    return 'Kliknij, aby mówić';
  };

  if (!isSupported) {
    return (
      <button
        ref={buttonRef}
        onClick={() => onError?.('Voice not supported in this browser')}
        disabled
        className={`rounded-full flex items-center justify-center transition-all ${getSizeClasses()} ${getColorClasses()} ${className}`}
        aria-label="Głos nieobsługiwany"
        title="Głos nie jest obsługiwany w tej przeglądarce"
      >
        <span className="text-lg">{getIcon()}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled || !isSupported}
        className={`rounded-full flex items-center justify-center transition-all ${getSizeClasses()} ${getColorClasses()} ${className}`}
        aria-label={getTooltipText()}
        aria-busy={status === 'listening' || status === 'processing'}
      >
        <span className="text-lg">{getIcon()}</span>
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-primary-900 border border-primary-700 rounded text-xs text-primary-50 whitespace-nowrap z-50">
          {getTooltipText()}
        </div>
      )}
      
      {/* Error indicator */}
      {status === 'error' && error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceButton;
