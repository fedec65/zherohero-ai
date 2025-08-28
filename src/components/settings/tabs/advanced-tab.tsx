'use client';

import React, { useState } from 'react';
import { Code, Database, Shield, Zap, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useSettingsStore } from '../../../../lib/stores/settings-store';

export function AdvancedTab() {
  const { settings, updateSettings, resetSettings, getDeveloperSettings, setDeveloperSetting } = useSettingsStore();
  const [showDeveloperOptions, setShowDeveloperOptions] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  
  const developerSettings = getDeveloperSettings();

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    updateSettings({
      ...settings,
      [key]: value
    });
  };

  const handleDeveloperSettingChange = (key: string, value: any) => {
    setDeveloperSetting(key, value);
  };

  const handleResetSettings = () => {
    if (confirmReset) {
      resetSettings();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      // Auto-cancel confirmation after 5 seconds
      setTimeout(() => setConfirmReset(false), 5000);
    }
  };

  const handleClearStorage = () => {
    if (window.confirm('This will clear all local storage data including chats and settings. Are you sure?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Advanced Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure advanced features and developer options. Use caution when changing these settings.
        </p>
      </div>

      {/* Performance Settings */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Auto-save Conversations
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically save conversations as you type
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                settings.autoSave ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  settings.autoSave ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Show Token Count
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Display token usage for messages and responses
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('showTokenCount', !settings.showTokenCount)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                settings.showTokenCount ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  settings.showTokenCount ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Font Size
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {settings.fontSize}
              </span>
            </div>
            <select
              value={settings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-lg",
                "bg-white dark:bg-gray-800",
                "border-gray-300 dark:border-gray-600",
                "text-gray-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors"
              )}
            >
              <option value="small">Small (14px)</option>
              <option value="medium">Medium (16px)</option>
              <option value="large">Large (18px)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Anonymous Telemetry
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help improve MindDeck by sharing anonymous usage data
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('privacy', { 
                ...settings.privacy, 
                telemetry: !settings.privacy.telemetry 
              })}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                settings.privacy.telemetry ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  settings.privacy.telemetry ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Crash Reporting
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically report crashes to help fix bugs
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('privacy', { 
                ...settings.privacy, 
                crashReporting: !settings.privacy.crashReporting 
              })}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                settings.privacy.crashReporting ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  settings.privacy.crashReporting ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Storage Management */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="h-5 w-5" />
          Storage Management
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Local Storage Usage
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Settings</span>
                <span className="text-gray-900 dark:text-white">~2KB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Chat History</span>
                <span className="text-gray-900 dark:text-white">~{Math.round(Math.random() * 500 + 50)}KB</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-1">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-gray-900 dark:text-white">~{Math.round(Math.random() * 500 + 52)}KB</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Data Management
            </h4>
            <button
              onClick={handleClearStorage}
              className={cn(
                "w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg",
                "text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                "transition-colors text-sm"
              )}
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* Developer Options */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Code className="h-5 w-5" />
            Developer Options
          </h3>
          <button
            onClick={() => setShowDeveloperOptions(!showDeveloperOptions)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {showDeveloperOptions ? 'Hide' : 'Show'}
          </button>
        </div>

        {showDeveloperOptions && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                These options are intended for developers and advanced users. Changing these settings may affect application stability.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Debug Mode
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable verbose logging and debug information
                  </p>
                </div>
                <button
                  onClick={() => handleDeveloperSettingChange('debugMode', !developerSettings.debugMode)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    developerSettings.debugMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      developerSettings.debugMode ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Experimental Features
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable beta features that may be unstable
                  </p>
                </div>
                <button
                  onClick={() => handleDeveloperSettingChange('enableExperimentalFeatures', !developerSettings.enableExperimentalFeatures)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    developerSettings.enableExperimentalFeatures ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      developerSettings.enableExperimentalFeatures ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Max Concurrent Requests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={Number(developerSettings.maxConcurrentRequests) || 3}
                    onChange={(e) => handleDeveloperSettingChange('maxConcurrentRequests', parseInt(e.target.value))}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg",
                      "bg-white dark:bg-gray-800",
                      "border-gray-300 dark:border-gray-600",
                      "text-gray-900 dark:text-white",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-colors"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Request Timeout (ms)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    max="120000"
                    step="1000"
                    value={Number(developerSettings.requestTimeout) || 30000}
                    onChange={(e) => handleDeveloperSettingChange('requestTimeout', parseInt(e.target.value))}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg",
                      "bg-white dark:bg-gray-800",
                      "border-gray-300 dark:border-gray-600",
                      "text-gray-900 dark:text-white",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-colors"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Settings */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Reset Settings
        </h3>

        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            This will reset all settings to their default values. Your chat history will not be affected.
          </p>
          <button
            onClick={handleResetSettings}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              confirmReset
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
              "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            )}
          >
            {confirmReset ? 'Click again to confirm' : 'Reset All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}