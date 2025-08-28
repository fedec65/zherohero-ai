/**
 * Speech Recognition Service - Handles audio recording and transcription via OpenAI Whisper
 */

import { useSettingsStore } from '../stores/settings-store';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

export interface SpeechRecognitionResult {
  text: string;
  confidence?: number;
  duration: number;
}

export interface SpeechRecognitionError {
  type: 'permission-denied' | 'no-microphone' | 'network-error' | 'transcription-error' | 'api-key-missing' | 'recording-error';
  message: string;
  details?: string;
}

export interface RecordingOptions {
  maxDuration?: number; // in seconds, default 60
  sampleRate?: number; // default 16000 for Whisper
  channels?: number; // default 1 (mono)
  mimeType?: string; // preferred audio format
}

export class SpeechRecognitionService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private maxDuration: number = 60000; // 60 seconds default
  private recordingTimeout: NodeJS.Timeout | null = null;

  // State management
  private state: RecordingState = 'idle';
  private listeners: Map<string, ((state: RecordingState) => void)[]> = new Map();

  constructor() {
    this.listeners.set('stateChange', []);
    this.listeners.set('error', []);
    this.listeners.set('result', []);
  }

  /**
   * Check if speech recognition is available and supported
   */
  public isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check if microphone permission is granted
   */
  public async checkPermission(): Promise<boolean> {
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissions.state === 'granted';
    } catch (error) {
      // Fallback: try to get user media to check permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Request microphone permission
   */
  public async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Get current recording state
   */
  public getState(): RecordingState {
    return this.state;
  }

  /**
   * Check if currently recording
   */
  public isRecording(): boolean {
    return this.state === 'recording';
  }

  /**
   * Start recording audio
   */
  public async startRecording(options: RecordingOptions = {}): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error('Already recording or processing');
    }

    // Check if voice input is enabled in settings
    const settings = useSettingsStore.getState().settings;
    if (!settings.speech?.voiceInput) {
      throw new Error('Voice input is disabled in settings');
    }

    // Check if OpenAI API key is available
    const hasOpenAIKey = useSettingsStore.getState().hasApiKey('openai');
    if (!hasOpenAIKey) {
      const error: SpeechRecognitionError = {
        type: 'api-key-missing',
        message: 'OpenAI API key is required for voice transcription',
        details: 'Please configure your OpenAI API key in Settings'
      };
      this.emitError(error);
      return;
    }

    this.setState('recording');
    this.maxDuration = (options.maxDuration || 60) * 1000;

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options.sampleRate || 16000,
          channelCount: options.channels || 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Determine the best supported MIME type for the browser
      const mimeType = this.getBestMimeType(options.mimeType);
      
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
        audioBitsPerSecond: 128000, // Good quality for speech
      });

      // Reset audio chunks
      this.audioChunks = [];

      // Set up event listeners
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processRecording();
      };

      this.mediaRecorder.onerror = (event) => {
        const error: SpeechRecognitionError = {
          type: 'recording-error',
          message: 'Recording error occurred',
          details: (event as any).error?.message || 'Unknown recording error'
        };
        this.emitError(error);
      };

      // Start recording
      this.recordingStartTime = Date.now();
      this.mediaRecorder.start(1000); // Collect data every second

      // Set up auto-stop timer
      this.recordingTimeout = setTimeout(() => {
        if (this.state === 'recording') {
          this.stopRecording();
        }
      }, this.maxDuration);

    } catch (error) {
      this.setState('idle');
      
      let speechError: SpeechRecognitionError;
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          speechError = {
            type: 'permission-denied',
            message: 'Microphone access denied',
            details: 'Please allow microphone access to use voice input'
          };
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          speechError = {
            type: 'no-microphone',
            message: 'No microphone found',
            details: 'Please connect a microphone to use voice input'
          };
        } else {
          speechError = {
            type: 'recording-error',
            message: 'Failed to start recording',
            details: error.message
          };
        }
      } else {
        speechError = {
          type: 'recording-error',
          message: 'Unknown error starting recording',
          details: String(error)
        };
      }

      this.emitError(speechError);
    }
  }

  /**
   * Stop recording audio
   */
  public stopRecording(): Promise<void> {
    return new Promise((resolve) => {
      if (this.state !== 'recording' || !this.mediaRecorder) {
        resolve();
        return;
      }

      this.setState('processing');

      // Clear the auto-stop timer
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = null;
      }

      // Stop the media recorder
      this.mediaRecorder.onstop = async () => {
        await this.processRecording();
        resolve();
      };

      this.mediaRecorder.stop();

      // Stop all media tracks
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
    });
  }

  /**
   * Cancel recording without processing
   */
  public cancelRecording(): void {
    if (this.state !== 'recording') {
      return;
    }

    // Clear the auto-stop timer
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    // Stop media recorder without processing
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.audioChunks = [];
    this.setState('idle');
  }

  /**
   * Add event listener
   */
  public addEventListener(event: 'stateChange', listener: (state: RecordingState) => void): void;
  public addEventListener(event: 'error', listener: (error: SpeechRecognitionError) => void): void;
  public addEventListener(event: 'result', listener: (result: SpeechRecognitionResult) => void): void;
  public addEventListener(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.push(listener as any);
    this.listeners.set(event, eventListeners);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event) || [];
    const index = eventListeners.indexOf(listener as any);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.cancelRecording();
    this.listeners.clear();
  }

  // Private methods

  private setState(newState: RecordingState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emitStateChange(newState);
    }
  }

  private emitStateChange(state: RecordingState): void {
    const listeners = this.listeners.get('stateChange') || [];
    listeners.forEach(listener => listener(state));
  }

  private emitError(error: SpeechRecognitionError): void {
    this.setState('error');
    const listeners = this.listeners.get('error') || [];
    listeners.forEach(listener => (listener as any)(error));
    
    // Reset to idle after a short delay
    setTimeout(() => {
      if (this.state === 'error') {
        this.setState('idle');
      }
    }, 3000);
  }

  private emitResult(result: SpeechRecognitionResult): void {
    const listeners = this.listeners.get('result') || [];
    listeners.forEach(listener => (listener as any)(result));
  }

  private getBestMimeType(preferred?: string): string {
    const supportedTypes = [
      preferred,
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav'
    ].filter(Boolean) as string[];

    for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback
    return 'audio/webm';
  }

  private async processRecording(): Promise<void> {
    try {
      if (this.audioChunks.length === 0) {
        throw new Error('No audio data recorded');
      }

      // Calculate recording duration
      const duration = Date.now() - this.recordingStartTime;

      // Create audio blob
      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });

      // Check if recording is too short (less than 500ms)
      if (duration < 500) {
        throw new Error('Recording too short');
      }

      // Transcribe using OpenAI Whisper API
      const transcription = await this.transcribeAudio(audioBlob);

      // Emit result
      const result: SpeechRecognitionResult = {
        text: transcription,
        duration: duration / 1000, // Convert to seconds
      };

      this.emitResult(result);
      this.setState('idle');

    } catch (error) {
      const speechError: SpeechRecognitionError = {
        type: 'transcription-error',
        message: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : String(error)
      };
      this.emitError(speechError);
    }

    // Clean up
    this.audioChunks = [];
    this.mediaRecorder = null;
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    const apiKey = useSettingsStore.getState().getApiKey('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Convert blob to appropriate format for Whisper API
    const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');
    formData.append('language', 'en'); // Could be made configurable

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorData}`);
      }

      const transcription = await response.text();
      return transcription.trim();

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid OpenAI API key');
        } else if (error.message.includes('429')) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
      }
      throw new Error('Unknown transcription error');
    }
  }
}

// Singleton instance
let speechRecognitionService: SpeechRecognitionService | null = null;

export function getSpeechRecognitionService(): SpeechRecognitionService {
  if (!speechRecognitionService) {
    speechRecognitionService = new SpeechRecognitionService();
  }
  return speechRecognitionService;
}

export function cleanupSpeechRecognitionService(): void {
  if (speechRecognitionService) {
    speechRecognitionService.cleanup();
    speechRecognitionService = null;
  }
}