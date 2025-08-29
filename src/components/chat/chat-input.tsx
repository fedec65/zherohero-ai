'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '../ui/button';
import { ChatInput as BaseChatInput } from '../ui/textarea';
import { ModelSelector, DropdownOption } from '../ui/dropdown';
import { Tooltip } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { MicrophoneButton } from '../ui/microphone-button';
import { useChatStore } from '../../lib/stores/chat-store';
import { useModelStore } from '../../lib/stores/model-store';
import { useSettingsStore } from '../../lib/stores/settings-store';
import { cn } from '../../lib/utils';
import { SpeechRecognitionError } from '../../lib/services/speech-recognition';
import { toast } from 'react-hot-toast';

interface ChatInputProps {
  chatId: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInputComponent({ 
  chatId, 
  className, 
  placeholder = "Message AI...",
  disabled = false 
}: ChatInputProps) {
  const { sendMessage, loading } = useChatStore();
  const { models, selectedModel, setSelectedModel } = useModelStore();
  const { hasApiKey, settings } = useSettingsStore();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatId]);

  // Handle message send
  const handleSend = async () => {
    if (!message.trim() || loading.sendMessage) return;

    try {
      await sendMessage(chatId, message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Voice input handlers
  const handleVoiceTranscription = (text: string, duration: number) => {
    if (text.trim()) {
      // Append transcription to current message
      const currentText = message.trim();
      const newText = currentText ? `${currentText} ${text}` : text;
      setMessage(newText);
      
      // Focus input after transcription
      if (inputRef.current) {
        inputRef.current.focus();
        // Set cursor to end
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(newText.length, newText.length);
          }
        }, 0);
      }

      // Show success toast
      toast.success(`Voice input recorded (${duration.toFixed(1)}s)`);
    }
  };

  const handleVoiceError = (error: SpeechRecognitionError) => {
    // Show error toast with appropriate message
    let errorMessage = error.message;
    
    switch (error.type) {
      case 'api-key-missing':
        errorMessage = 'OpenAI API key required for voice input';
        break;
      case 'permission-denied':
        errorMessage = 'Microphone access denied';
        break;
      case 'no-microphone':
        errorMessage = 'No microphone found';
        break;
      case 'network-error':
        errorMessage = 'Network error during transcription';
        break;
      case 'transcription-error':
        errorMessage = 'Failed to transcribe audio';
        break;
      case 'recording-error':
        errorMessage = 'Recording failed';
        break;
      default:
        errorMessage = error.message || 'Voice input failed';
    }

    toast.error(errorMessage);
    console.error('Voice input error:', error);
  };

  // Get available models for dropdown
  const allModels = Object.values(models).flat();
  const modelOptions: DropdownOption[] = allModels.map(model => ({
    value: model.id,
    label: model.name,
    description: `${model.contextWindow.toLocaleString()} tokens`,
    disabled: false,
    icon: (
      <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-purple-500" />
    ),
  }));

  const currentSelectedModel = selectedModel?.modelId || null;
  const hasValidApiKey = selectedModel ? hasApiKey(selectedModel.provider) : false;

  const canSend = message.trim().length > 0 && 
                  !loading.sendMessage && 
                  selectedModel && 
                  hasValidApiKey;

  return (
    <div 
      className={cn(
        'border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-600 dark:text-blue-400 font-medium">Drop files to attach</p>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
              >
                <div className="text-gray-500">
                  {file.type.startsWith('image/') ? '🖼️' : '📁'}
                </div>
                <span className="truncate max-w-[150px]">{file.name}</span>
                <span className="text-gray-400 text-xs">
                  {(file.size / 1024).toFixed(1)}KB
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => removeAttachment(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main input area */}
      <div className="p-4">
        {/* Model selector */}
        <div className="mb-3 flex items-center gap-2">
          <ModelSelector
            models={allModels.map(model => ({
              id: model.id,
              name: model.name,
              provider: model.provider,
              contextWindow: `${model.contextWindow.toLocaleString()} tokens`,
              isNew: model.isNew,
              disabled: false,
            }))}
            selectedModel={currentSelectedModel}
            onModelChange={(modelId) => {
              const model = allModels.find(m => m.id === modelId);
              if (model) {
                setSelectedModel(model.provider, modelId);
              }
            }}
            placeholder="Select model..."
            className="w-64"
            triggerClassName="h-9 text-sm"
          />
          
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              hasValidApiKey ? "text-green-600 dark:text-green-400 border-green-300" : 
              selectedModel ? "text-red-600 dark:text-red-400 border-red-300" :
              "text-gray-500 dark:text-gray-400"
            )}
          >
            {selectedModel ? (
              hasValidApiKey ? 
                `${selectedModel.provider} ✓` : 
                `${selectedModel.provider} ⚠️`
            ) : 'No model'}
          </Badge>
        </div>

        {/* Input container */}
        <div className="relative">
          <BaseChatInput
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading.sendMessage}
            className={cn(
              'pr-24 pb-12', // Extra space for buttons
              'border-gray-200 dark:border-gray-700',
              'focus:border-blue-500 dark:focus:border-blue-400',
              loading.sendMessage && 'opacity-50'
            )}
            maxLength={4000}
            showCharCount={true}
          />

          {/* Bottom action bar */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            {/* Left side actions */}
            <div className="flex items-center gap-1">
              <Tooltip content="Attach files">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </Tooltip>

              {/* Voice input button - only show if enabled in settings */}
              {settings.speech?.voiceInput && (
                <MicrophoneButton
                  onTranscription={handleVoiceTranscription}
                  onError={handleVoiceError}
                  disabled={disabled || loading.sendMessage}
                  size="sm"
                  maxDuration={60}
                  showDuration={false}
                />
              )}

              <Tooltip content="Emoji">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>

            {/* Send button */}
            <Tooltip content={
              !selectedModel ? "Select a model first" :
              !hasValidApiKey ? `Configure ${selectedModel.provider.toUpperCase()} API key in Settings` :
              !message.trim() ? "Enter a message" :
              "Send message"
            }>
              <Button
                type="button"
                size="sm"
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "h-8 px-4 transition-all",
                  canSend 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                )}
              >
                {loading.sendMessage ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Sending</span>
                  </div>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    <span className="text-xs">Send</span>
                  </>
                )}
              </Button>
            </Tooltip>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.md"
          />
        </div>

        {/* Keyboard shortcut hint */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>
            Press Enter to send, Shift + Enter for new line
          </span>
          {message.length > 0 && (
            <span>{message.length}/4000</span>
          )}
        </div>
      </div>

      {/* Emoji picker (placeholder) */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Emoji picker coming soon...
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setShowEmojiPicker(false)}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}