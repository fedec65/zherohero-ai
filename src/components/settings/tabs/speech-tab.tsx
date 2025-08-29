"use client";

import React, { useState, useEffect } from "react";
import {
  Volume2,
  Mic,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useSettingsStore } from "../../../lib/stores/settings-store";
import { getSpeechRecognitionService } from "../../../lib/services/speech-recognition";

interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: "male" | "female" | "neutral";
}

export function SpeechTab() {
  const { settings, updateSpeechSettings, setSpeechSetting, hasApiKey } =
    useSettingsStore();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [speechSupported, setSpeechSupported] = useState(false);

  // Get current speech settings with defaults
  const speechSettings = settings.speech || {
    enabled: false,
    selectedVoice: "",
    rate: 1.0,
    pitch: 1.0,
    autoSpeak: false,
    voiceInput: false,
  };

  const speechService = getSpeechRecognitionService();

  // Initialize and check capabilities
  useEffect(() => {
    // Check speech synthesis support
    setSpeechSupported(typeof speechSynthesis !== "undefined");

    // Check microphone permission
    const checkMicrophonePermission = async () => {
      const hasPermission = await speechService.checkPermission();
      setMicrophonePermission(hasPermission ? "granted" : "denied");
    };

    // Load available voices
    const loadVoices = () => {
      if (typeof speechSynthesis !== "undefined") {
        const availableVoices = speechSynthesis.getVoices();
        const voiceOptions: VoiceOption[] = availableVoices.map((voice) => ({
          id: voice.name,
          name: voice.name,
          language: voice.lang,
          gender: voice.name.toLowerCase().includes("male")
            ? voice.name.toLowerCase().includes("female")
              ? "female"
              : "male"
            : "neutral",
        }));
        setVoices(voiceOptions);

        // Set default voice if none selected and voices are available
        if (!speechSettings.selectedVoice && voiceOptions.length > 0) {
          setSpeechSetting("selectedVoice", voiceOptions[0].id);
        }
      }
    };

    // Load voices when component mounts
    loadVoices();
    checkMicrophonePermission();

    // Some browsers load voices asynchronously
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof speechSynthesis !== "undefined") {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [speechService, speechSettings.selectedVoice, setSpeechSetting]);

  const handleTestVoice = async () => {
    if (!speechSettings.selectedVoice || !speechSupported) return;

    setIsTesting(true);

    try {
      const utterance = new SpeechSynthesisUtterance(
        "Hello! This is a test of your selected voice settings.",
      );

      const voice = voices.find((v) => v.id === speechSettings.selectedVoice);
      const systemVoice = speechSynthesis
        .getVoices()
        .find((v) => v.name === voice?.name);

      if (systemVoice) {
        utterance.voice = systemVoice;
      }

      utterance.rate = speechSettings.rate;
      utterance.pitch = speechSettings.pitch;

      utterance.onend = () => {
        setIsTesting(false);
      };

      utterance.onerror = () => {
        setIsTesting(false);
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech test error:", error);
      setIsTesting(false);
    }
  };

  const handleStopSpeech = () => {
    if (speechSupported) {
      speechSynthesis.cancel();
    }
    setIsTesting(false);
  };

  const handleResetSettings = () => {
    updateSpeechSettings({
      rate: 1.0,
      pitch: 1.0,
      selectedVoice: voices.length > 0 ? voices[0].id : "",
    });
  };

  const handleVoiceChange = (voiceId: string) => {
    setSpeechSetting("selectedVoice", voiceId);
  };

  const handleRateChange = (rate: number) => {
    setSpeechSetting("rate", rate);
  };

  const handlePitchChange = (pitch: number) => {
    setSpeechSetting("pitch", pitch);
  };

  const handleToggleSpeechOutput = () => {
    setSpeechSetting("enabled", !speechSettings.enabled);
  };

  const handleToggleVoiceInput = () => {
    setSpeechSetting("voiceInput", !speechSettings.voiceInput);
  };

  const handleRequestMicrophonePermission = async () => {
    const granted = await speechService.requestPermission();
    setMicrophonePermission(granted ? "granted" : "denied");
  };

  // Check if OpenAI API key is configured
  const hasOpenAIKey = hasApiKey("openai");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Speech Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure text-to-speech and voice recognition settings for enhanced
          interaction.
        </p>
      </div>

      {/* Speech Output Section */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
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
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                speechSettings.enabled
                  ? "bg-blue-600"
                  : "bg-gray-300 dark:bg-gray-600",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  speechSettings.enabled ? "translate-x-6" : "translate-x-1",
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
                "w-full px-3 py-2 border rounded-lg",
                "bg-white dark:bg-gray-800",
                "border-gray-300 dark:border-gray-600",
                "text-gray-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors",
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
                "w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
                "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600",
                "[&::-webkit-slider-thumb]:cursor-pointer",
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
                "w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
                "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600",
                "[&::-webkit-slider-thumb]:cursor-pointer",
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
                "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors flex items-center gap-2",
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
                "px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg",
                "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors flex items-center gap-2",
              )}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Speech Input Section */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
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
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                speechSettings.voiceInput
                  ? "bg-blue-600"
                  : "bg-gray-300 dark:bg-gray-600",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  speechSettings.voiceInput ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>

          {/* Requirements Section - Orange Warning Box */}
          {speechSettings.voiceInput && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
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
                            ? "text-green-700 dark:text-green-300"
                            : ""
                        }
                      >
                        OpenAI API key is required
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {microphonePermission === "granted" ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      )}
                      <span
                        className={
                          microphonePermission === "granted"
                            ? "text-green-700 dark:text-green-300"
                            : ""
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

                  {microphonePermission === "denied" && (
                    <button
                      onClick={handleRequestMicrophonePermission}
                      className="text-sm px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
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
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                    1
                  </span>
                  <span>
                    Click the microphone button in the chat input area
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                    2
                  </span>
                  <span>Allow microphone access if prompted</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                    3
                  </span>
                  <span>Speak your message clearly</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
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
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              // Settings are automatically saved via the store
              // This button provides visual feedback that settings are saved
            }}
            className={cn(
              "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "transition-colors flex items-center gap-2",
            )}
          >
            <CheckCircle className="h-4 w-4" />
            Save Speech Settings
          </button>
        </div>
      )}

      {/* Browser Support Notice */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          Browser Compatibility
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Speech features require modern browser support. Voice input uses
          OpenAI Whisper API for transcription. Text-to-speech uses your
          browser&apos;s built-in Web Speech API.
        </p>
      </div>
    </div>
  );
}
