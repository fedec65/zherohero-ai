/**
 * Microphone Button Component - Handles voice input recording with visual feedback
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Square, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Tooltip } from './tooltip';
import { cn } from '../../lib/utils';
import { 
  getSpeechRecognitionService, 
  RecordingState, 
  SpeechRecognitionResult, 
  SpeechRecognitionError 
} from '../../lib/services/speech-recognition';

export interface MicrophoneButtonProps {
  onTranscription?: (text: string, duration: number) => void;
  onError?: (error: SpeechRecognitionError) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  maxDuration?: number; // in seconds
  showDuration?: boolean;
}

export function MicrophoneButton({
  onTranscription,
  onError,
  disabled = false,
  className,
  size = 'sm',
  maxDuration = 60,
  showDuration = false,
}: MicrophoneButtonProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const speechService = getSpeechRecognitionService();
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check if speech recognition is supported
  const isSupported = speechService.isSupported();

  // Size configurations
  const sizeConfig = {
    sm: { button: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-xs' },
    md: { button: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-sm' },
    lg: { button: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-base' },
  };

  const config = sizeConfig[size];

  // Check microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (isSupported) {
        const granted = await speechService.checkPermission();
        setPermissionGranted(granted);
      }
    };
    checkPermission();
  }, [isSupported, speechService]);

  // Set up event listeners
  useEffect(() => {
    const handleStateChange = (state: RecordingState) => {
      setRecordingState(state);
      
      if (state === 'recording') {
        startTimeRef.current = Date.now();
        startDurationTimer();
      } else {
        stopDurationTimer();
      }
      
      if (state === 'idle' || state === 'error') {
        setRecordingDuration(0);
        setError(null);
      }
    };

    const handleResult = (result: SpeechRecognitionResult) => {
      onTranscription?.(result.text, result.duration);
    };

    const handleError = (error: SpeechRecognitionError) => {
      setError(error.message);
      onError?.(error);
    };

    speechService.addEventListener('stateChange', handleStateChange);
    speechService.addEventListener('result', handleResult);
    speechService.addEventListener('error', handleError);

    return () => {
      speechService.removeEventListener('stateChange', handleStateChange);
      speechService.removeEventListener('result', handleResult);
      speechService.removeEventListener('error', handleError);
    };
  }, [speechService, onTranscription, onError]);

  // Duration timer functions
  const startDurationTimer = useCallback(() => {
    durationIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setRecordingDuration(elapsed);
    }, 100);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
    };
  }, [stopDurationTimer]);

  // Handle button click
  const handleClick = async () => {
    if (!isSupported) {
      const error: SpeechRecognitionError = {
        type: 'no-microphone',
        message: 'Speech recognition not supported in this browser',
      };
      onError?.(error);
      return;
    }

    if (recordingState === 'recording') {
      // Stop recording
      await speechService.stopRecording();
    } else if (recordingState === 'idle') {
      // Request permission if not granted
      if (permissionGranted === false || permissionGranted === null) {
        const granted = await speechService.requestPermission();
        setPermissionGranted(granted);
        
        if (!granted) {
          const error: SpeechRecognitionError = {
            type: 'permission-denied',
            message: 'Microphone access denied',
            details: 'Please allow microphone access to use voice input'
          };
          onError?.(error);
          return;
        }
      }

      // Start recording
      try {
        await speechService.startRecording({ maxDuration });
      } catch (error) {
        const speechError: SpeechRecognitionError = {
          type: 'recording-error',
          message: error instanceof Error ? error.message : 'Failed to start recording',
        };
        onError?.(speechError);
      }
    }
  };

  // Get button variant and color based on state
  const getButtonVariant = () => {
    switch (recordingState) {
      case 'recording':
        return 'destructive'; // Red for recording
      case 'processing':
        return 'secondary'; // Gray for processing
      case 'error':
        return 'destructive'; // Red for error
      default:
        return 'ghost'; // Default
    }
  };

  // Get icon based on state
  const getIcon = () => {
    switch (recordingState) {
      case 'recording':
        return <Square className={cn(config.icon, 'animate-pulse')} />;
      case 'processing':
        return <Loader2 className={cn(config.icon, 'animate-spin')} />;
      case 'error':
        return <AlertCircle className={config.icon} />;
      default:
        return permissionGranted === false ? 
          <MicOff className={config.icon} /> : 
          <Mic className={config.icon} />;
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (!isSupported) return 'Speech recognition not supported';
    if (disabled) return 'Voice input disabled';
    
    switch (recordingState) {
      case 'recording':
        return `Recording... (${Math.floor(recordingDuration)}s)`;
      case 'processing':
        return 'Processing audio...';
      case 'error':
        return error || 'Recording error';
      default:
        if (permissionGranted === false) {
          return 'Microphone access denied. Click to request permission.';
        }
        return 'Click to start voice recording';
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Tooltip content={getTooltipText()}>
        <Button
          type="button"
          variant={getButtonVariant()}
          size="sm"
          className={cn(
            config.button,
            'p-0 relative transition-all',
            recordingState === 'recording' && 'animate-pulse ring-2 ring-red-300',
            recordingState === 'error' && 'ring-2 ring-red-300',
            !isSupported && 'opacity-50 cursor-not-allowed',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleClick}
          disabled={disabled || !isSupported || recordingState === 'processing'}
        >
          {getIcon()}
          
          {/* Recording indicator dot */}
          {recordingState === 'recording' && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </Tooltip>

      {/* Duration display */}
      {showDuration && recordingState === 'recording' && (
        <div className={cn(
          'text-red-500 font-mono tabular-nums',
          config.text
        )}>
          {formatDuration(recordingDuration)}
          {recordingDuration >= maxDuration - 5 && (
            <span className="ml-1 text-red-600 animate-pulse">!</span>
          )}
        </div>
      )}

      {/* Error display */}
      {recordingState === 'error' && error && (
        <div className={cn(
          'text-red-500 max-w-xs truncate',
          config.text
        )}>
          {error}
        </div>
      )}
    </div>
  );
}

export default MicrophoneButton;