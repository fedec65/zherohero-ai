'use client'

import React, { useState, useEffect } from 'react'
import {
  Volume2,
  Mic,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useSettingsStore } from '../../../lib/stores/settings-store'
import { getSpeechRecognitionService } from '../../../lib/services/speech-recognition'

interface VoiceOption {
  id: string
  name: string
  language: string
  gender: 'male' | 'female' | 'neutral'
}

export function SpeechTab() {
  const { settings, updateSpeechSettings, setSpeechSetting, hasApiKey } =
    useSettingsStore()
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [microphonePermission, setMicrophonePermission] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown')
  const [speechSupported, setSpeechSupported] = useState(false)

  // Get current speech settings with defaults
  const speechSettings = settings.speech || {
    enabled: false,
    selectedVoice: '',
    rate: 1.0,
    pitch: 1.0,
    autoSpeak: false,
    voiceInput: false,
  }

  const speechService = getSpeechRecognitionService()

  // Initialize and check capabilities
  useEffect(() => {
    // Check speech synthesis support
    setSpeechSupported(typeof speechSynthesis !== 'undefined')

    // Check microphone permission
    const checkMicrophonePermission = async () => {
      const hasPermission = await speechService.checkPermission()
      setMicrophonePermission(hasPermission ? 'granted' : 'denied')
    }

    // Load available voices
    const loadVoices = () => {
      if (typeof speechSynthesis !== 'undefined') {
        const availableVoices = speechSynthesis.getVoices()
        const voiceOptions: VoiceOption[] = availableVoices.map((voice) => ({
          id: voice.name,
          name: voice.name,
          language: voice.lang,
          gender: voice.name.toLowerCase().includes('male')
            ? voice.name.toLowerCase().includes('female')
              ? 'female'
              : 'male'
            : 'neutral',
        }))
        setVoices(voiceOptions)

        // Set default voice if none selected and voices are available
        if (!speechSettings.selectedVoice && voiceOptions.length > 0) {
          setSpeechSetting('selectedVoice', voiceOptions[0].id)
        }
      }
    }

    // Load voices when component mounts
    loadVoices()
    checkMicrophonePermission()

    // Some browsers load voices asynchronously
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.onvoiceschanged = null
      }
    }
  }, [speechService, speechSettings.selectedVoice, setSpeechSetting])

  const handleTestVoice = async () => {
    if (!speechSettings.selectedVoice || !speechSupported) return

    setIsTesting(true)

    try {
      const utterance = new SpeechSynthesisUtterance(
        'Hello! This is a test of your selected voice settings.'
      )

      const voice = voices.find((v) => v.id === speechSettings.selectedVoice)
      const systemVoice = speechSynthesis
        .getVoices()
        .find((v) => v.name === voice?.name)

      if (systemVoice) {
        utterance.voice = systemVoice
      }

      utterance.rate = speechSettings.rate
      utterance.pitch = speechSettings.pitch

      utterance.onend = () => {
        setIsTesting(false)
      }

      utterance.onerror = () => {
        setIsTesting(false)
      }

      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Speech test error:', error)
      setIsTesting(false)
    }
  }

  const handleStopSpeech = () => {
    if (speechSupported) {
      speechSynthesis.cancel()
    }
    setIsTesting(false)
  }

  const handleResetSettings = () => {
    updateSpeechSettings({
      rate: 1.0,
      pitch: 1.0,
      selectedVoice: voices.length > 0 ? voices[0].id : '',
    })
  }

  const handleVoiceChange = (voiceId: string) => {
    setSpeechSetting('selectedVoice', voiceId)
  }

  const handleRateChange = (rate: number) => {
    setSpeechSetting('rate', rate)
  }

  const handlePitchChange = (pitch: number) => {
    setSpeechSetting('pitch', pitch)
  }

  const handleToggleSpeechOutput = () => {
    setSpeechSetting('enabled', !speechSettings.enabled)
  }

  const handleToggleVoiceInput = () => {
    setSpeechSetting('voiceInput', !speechSettings.voiceInput)
  }

  const handleRequestMicrophonePermission = async () => {
    const granted = await speechService.requestPermission()
    setMicrophonePermission(granted ? 'granted' : 'denied')
  }

  // Check if OpenAI API key is configured
  const hasOpenAIKey = hasApiKey('openai')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
          Speech Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure text-to-speech and voice recognition settings for enhanced
          interaction.
        </p>
      </div>

      {/* Speech Output Section */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-white">
          <Volume2 className="h-5 w-5" />
          Text-to-Speech
        </h3>

        <div className="space-y-4">
          {/* Enable Speech Output */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Speech Output
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Read AI responses aloud automatically
              </p>
            </div>
            <button
              onClick={handleToggleSpeechOutput}
              disabled={!speechSupported}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                speechSettings.enabled
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  speechSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Voice
            </label>
            <select
              value={speechSettings.selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              disabled={!speechSettings.enabled || !speechSupported}
              className={cn(
                'w-full rounded-lg border px-3 py-2',
                'bg-white dark:bg-gray-800',
                'border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-colors'
              )}
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} ({voice.language})
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Speech Rate
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {speechSettings.rate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechSettings.rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              disabled={!speechSettings.enabled || !speechSupported}
              className={cn(
                'h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700',
                'disabled:cursor-not-allowed disabled:opacity-50',
                '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none',
                '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600',
                '[&::-webkit-slider-thumb]:cursor-pointer'
              )}
            />
          </div>

          {/* Speech Pitch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Pitch
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {speechSettings.pitch.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechSettings.pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              disabled={!speechSettings.enabled || !speechSupported}
              className={cn(
                'h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700',
                'disabled:cursor-not-allowed disabled:opacity-50',
                '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none',
                '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600',
                '[&::-webkit-slider-thumb]:cursor-pointer'
              )}
            />
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2">
            <button
              onClick={isTesting ? handleStopSpeech : handleTestVoice}
              disabled={
                !speechSettings.selectedVoice ||
                !speechSettings.enabled ||
                !speechSupported
              }
              className={cn(
                'rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center gap-2 transition-colors'
              )}
            >
              {isTesting ? (
                <>
                  <Pause className="h-4 w-4" />
                  Stop Test
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Test Voice
                </>
              )}
            </button>

            <button
              onClick={handleResetSettings}
              disabled={!speechSupported}
              className={cn(
                'rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600',
                'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center gap-2 transition-colors'
              )}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Speech Input Section */}
      <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-white">
          <Mic className="h-5 w-5" />
          Voice Input
        </h3>

        <div className="space-y-4">
          {/* Enable Voice Input */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Voice Input
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Show microphone button in chat input
              </p>
            </div>
            <button
              onClick={handleToggleVoiceInput}
              disabled={!speechService.isSupported()}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                speechSettings.voiceInput
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  speechSettings.voiceInput ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Requirements Section - Orange Warning Box */}
          {speechSettings.voiceInput && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                    Requirements
                  </h4>
                  <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                    <div className="flex items-center gap-2">
                      {hasOpenAIKey ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      )}
                      <span
                        className={
                          hasOpenAIKey
                            ? 'text-green-700 dark:text-green-300'
                            : ''
                        }
                      >
                        OpenAI API key is required
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {microphonePermission === 'granted' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      )}
                      <span
                        className={
                          microphonePermission === 'granted'
                            ? 'text-green-700 dark:text-green-300'
                            : ''
                        }
                      >
                        Microphone access permission will be requested
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span>Audio is sent directly to OpenAI</span>
                    </div>
                  </div>

                  {microphonePermission === 'denied' && (
                    <button
                      onClick={handleRequestMicrophonePermission}
                      className="rounded bg-orange-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-orange-700"
                    >
                      Request Microphone Permission
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* How to Use Section */}
          {speechSettings.voiceInput && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                How to Use
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    1
                  </span>
                  <span>
                    Click the microphone button in the chat input area
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    2
                  </span>
                  <span>Allow microphone access if prompted</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    3
                  </span>
                  <span>Speak your message clearly</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    4
                  </span>
                  <span>Click again to stop recording and transcribe</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Settings Button */}
      {speechSettings.voiceInput && (
        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            onClick={() => {
              // Settings are automatically saved via the store
              // This button provides visual feedback that settings are saved
            }}
            className={cn(
              'rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'flex items-center gap-2 transition-colors'
            )}
          >
            <CheckCircle className="h-4 w-4" />
            Save Speech Settings
          </button>
        </div>
      )}

      {/* Browser Support Notice */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
          Browser Compatibility
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Speech features require modern browser support. Voice input uses
          OpenAI Whisper API for transcription. Text-to-speech uses your
          browser&apos;s built-in Web Speech API.
        </p>
      </div>
    </div>
  )
}
