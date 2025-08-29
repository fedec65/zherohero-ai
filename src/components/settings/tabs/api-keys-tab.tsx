'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ExternalLink, Check, X, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useSettingsStore } from '../../../lib/stores/settings-store';
import { AIProvider } from '../../../lib/stores/types';

interface APIKeyField {
  provider: AIProvider;
  label: string;
  placeholder: string;
  docsUrl: string;
}

const apiKeyFields: APIKeyField[] = [
  {
    provider: 'openai',
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    provider: 'anthropic',
    label: 'Anthropic API Key',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/',
  },
  {
    provider: 'gemini',
    label: 'Google Gemini API Key',
    placeholder: 'AIza...',
    docsUrl: 'https://makersuite.google.com/app/apikey',
  },
  {
    provider: 'xai',
    label: 'xAI API Key',
    placeholder: 'xai-...',
    docsUrl: 'https://console.x.ai/',
  },
  {
    provider: 'deepseek',
    label: 'DeepSeek API Key',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    provider: 'openrouter',
    label: 'OpenRouter API Key',
    placeholder: 'sk-or-v1-...',
    docsUrl: 'https://openrouter.ai/keys',
  },
];

export function APIKeysTab() {
  const { settings, setApiKey, getApiKey, validateApiKey, testApiConnection } = useSettingsStore();
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({} as Record<AIProvider, boolean>);
  const [testingKeys, setTestingKeys] = useState<Record<AIProvider, boolean>>({} as Record<AIProvider, boolean>);
  const [testResults, setTestResults] = useState<Record<AIProvider, 'success' | 'error' | null>>({} as Record<AIProvider, 'success' | 'error' | null>);
  const [localKeys, setLocalKeys] = useState<Record<AIProvider, string>>({} as Record<AIProvider, string>);

  const handleToggleVisibility = (provider: AIProvider) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleKeyChange = (provider: AIProvider, value: string) => {
    setLocalKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    
    // Clear test results when key changes
    setTestResults(prev => ({
      ...prev,
      [provider]: null
    }));
    
    // Auto-save if key looks valid
    if (value.trim()) {
      setApiKey(provider, value.trim());
    }
  };

  const handleTestConnection = async (provider: AIProvider) => {
    const key = localKeys[provider] || getApiKey(provider);
    if (!key) return;

    setTestingKeys(prev => ({ ...prev, [provider]: true }));
    setTestResults(prev => ({ ...prev, [provider]: null }));

    try {
      const isValid = await validateApiKey(provider, key);
      if (!isValid) {
        setTestResults(prev => ({ ...prev, [provider]: 'error' }));
        return;
      }

      const isConnected = await testApiConnection(provider);
      setTestResults(prev => ({ 
        ...prev, 
        [provider]: isConnected ? 'success' : 'error' 
      }));
    } catch (error) {
      console.error(`Error testing ${provider} connection:`, error);
      setTestResults(prev => ({ ...prev, [provider]: 'error' }));
    } finally {
      setTestingKeys(prev => ({ ...prev, [provider]: false }));
    }
  };

  const getCurrentValue = (provider: AIProvider): string => {
    return localKeys[provider] ?? getApiKey(provider) ?? '';
  };

  const getInputType = (provider: AIProvider): string => {
    return showKeys[provider] ? 'text' : 'password';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          API Keys
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure your API keys to enable AI model integrations. All keys are stored locally and never sent to our servers.
        </p>
      </div>

      <div className="space-y-6">
        {apiKeyFields.map((field) => {
          const currentValue = getCurrentValue(field.provider);
          const isVisible = showKeys[field.provider];
          const isTesting = testingKeys[field.provider];
          const testResult = testResults[field.provider];

          return (
            <div key={field.provider} className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`${field.provider}-key`}
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  {field.label}
                </label>
                <a
                  href={field.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400",
                    "hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  )}
                >
                  Get API Key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id={`${field.provider}-key`}
                    type={getInputType(field.provider)}
                    value={currentValue}
                    onChange={(e) => handleKeyChange(field.provider, e.target.value)}
                    placeholder={field.placeholder}
                    className={cn(
                      "w-full px-3 py-2 pr-10 border rounded-lg",
                      "bg-white dark:bg-gray-800",
                      "border-gray-300 dark:border-gray-600",
                      "text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-colors"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(field.provider)}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2",
                      "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                      "focus:outline-none focus:text-gray-600 dark:focus:text-gray-300",
                      "transition-colors"
                    )}
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestConnection(field.provider)}
                  disabled={!currentValue || isTesting}
                  className={cn(
                    "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg",
                    "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-50 dark:hover:bg-gray-700",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors min-w-[80px] flex items-center justify-center gap-1"
                  )}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Testing</span>
                    </>
                  ) : testResult === 'success' ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-xs">Valid</span>
                    </>
                  ) : testResult === 'error' ? (
                    <>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-xs">Error</span>
                    </>
                  ) : (
                    <span className="text-xs">Test</span>
                  )}
                </button>
              </div>

              {testResult === 'error' && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Connection test failed. Please check your API key and try again.
                </p>
              )}

              {testResult === 'success' && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Connection successful! API key is working correctly.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
          Security Notice
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Your API keys are stored locally in your browser and are never transmitted to our servers. 
          They are only used to make direct requests to the respective AI providers.
        </p>
      </div>
    </div>
  );
}