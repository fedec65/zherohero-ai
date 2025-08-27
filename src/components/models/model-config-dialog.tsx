'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  RotateCcw, 
  Download, 
  Upload, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import type { Model, CustomModel, ModelConfig, AIProvider } from '../../../lib/stores/types';
import { useModelStore } from '../../../lib/stores/model-store';
import { useModelConfig, useModelTest } from '../../../lib/stores/hooks';

interface ModelConfigDialogProps {
  model: Model | CustomModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ConfigField {
  key: keyof ModelConfig;
  label: string;
  type: 'number' | 'text' | 'textarea';
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
}

const configFields: ConfigField[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    type: 'number',
    min: 0,
    max: 2,
    step: 0.1,
    description: 'Controls randomness in responses (0 = deterministic, 2 = very creative)',
  },
  {
    key: 'maxTokens',
    label: 'Max Tokens',
    type: 'number',
    min: 1,
    max: 8192,
    step: 1,
    description: 'Maximum number of tokens to generate (leave empty for model default)',
  },
  {
    key: 'topP',
    label: 'Top P',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
    description: 'Nucleus sampling threshold (0.1 = only top 10% likely tokens)',
  },
  {
    key: 'frequencyPenalty',
    label: 'Frequency Penalty',
    type: 'number',
    min: -2,
    max: 2,
    step: 0.1,
    description: 'Reduces repetition of frequent tokens (positive = less repetition)',
  },
  {
    key: 'presencePenalty',
    label: 'Presence Penalty',
    type: 'number',
    min: -2,
    max: 2,
    step: 0.1,
    description: 'Encourages diverse topics (positive = more topic variety)',
  },
];

export function ModelConfigDialog({ model, open, onOpenChange }: ModelConfigDialogProps) {
  // Use optimized hooks for better performance
  const { config: storeConfig, updateConfig, resetConfig } = useModelConfig(model.provider, model.id);
  const { testResult, isLoading: isTestingModel, testModel } = useModelTest(model.provider, model.id);
  
  // Still need validateModelConfig and getModelConfig from store
  const validateModelConfig = useModelStore(state => state.validateModelConfig);
  const getModelConfig = useModelStore(state => state.getModelConfig);

  const [config, setConfig] = useState<ModelConfig>(() => storeConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Update local config when model changes
  useEffect(() => {
    const modelConfig = getModelConfig(model.provider, model.id);
    setConfig(modelConfig);
    setHasChanges(false);
    setErrors({});
  }, [model.provider, model.id, getModelConfig]);

  const handleConfigChange = (field: keyof ModelConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setHasChanges(true);

    // Validate the field
    const validation = validateModelConfig(newConfig);
    const fieldErrors = validation.errors.filter(error => 
      error.toLowerCase().includes(field.replace(/([A-Z])/g, ' $1').toLowerCase())
    );
    
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[0] || '',
    }));
  };

  const handleSave = () => {
    const validation = validateModelConfig(config);
    
    if (!validation.isValid) {
      // Set all validation errors
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        configFields.forEach(field => {
          if (error.toLowerCase().includes(field.key.replace(/([A-Z])/g, ' $1').toLowerCase())) {
            errorMap[field.key] = error;
          }
        });
      });
      setErrors(errorMap);
      return;
    }

    updateConfig(config);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleReset = () => {
    resetConfig();
    const resetConfigData = getModelConfig(model.provider, model.id);
    setConfig(resetConfigData);
    setErrors({});
    setHasChanges(false);
  };

  const handleTest = async () => {
    if (hasChanges) {
      // Save config first
      handleSave();
    }
    
    try {
      await testModel(model.provider, model.id);
    } catch (error) {
      console.error('Model test failed:', error);
    }
  };

  const handleExportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.provider}-${model.id}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig(importedConfig);
        setHasChanges(true);
      } catch (error) {
        console.error('Failed to import config:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    const input = document.getElementById(`import-config-${model.id}`) as HTMLInputElement;
    input?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configure {model.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {model.provider.toUpperCase()} • Context: {model.contextWindow.toLocaleString()} tokens
                </p>
              </div>
            </div>
            
            {model.isNew && (
              <Badge variant="success" size="sm">
                New
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Test Section */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Model Test
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isTestingModel}
                leftIcon={isTestingModel ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              >
                {isTestingModel ? 'Testing...' : 'Test Model'}
              </Button>
            </div>
            
            {testResult && (
              <div className="text-sm">
                {testResult.loading ? (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing model response...
                  </div>
                ) : testResult.error ? (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {testResult.error}
                  </div>
                ) : testResult.data ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Test successful • Response time: {testResult.data.latency}ms
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Configuration Fields */}
          <div className="space-y-6">
            {configFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {field.label}
                </label>
                
                {field.type === 'textarea' ? (
                  <Textarea
                    value={config[field.key] as string || ''}
                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={errors[field.key] ? 'border-red-500' : ''}
                    rows={3}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={config[field.key] ?? ''}
                    onChange={(e) => {
                      const value = field.type === 'number' 
                        ? e.target.value === '' ? undefined : Number(e.target.value)
                        : e.target.value;
                      handleConfigChange(field.key, value);
                    }}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={errors[field.key] ? 'border-red-500' : ''}
                  />
                )}
                
                {field.description && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {field.description}
                  </p>
                )}
                
                {errors[field.key] && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors[field.key]}
                  </p>
                )}
              </div>
            ))}

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                System Prompt
              </label>
              <Textarea
                value={config.systemPrompt || ''}
                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                placeholder="You are a helpful assistant..."
                className={errors.systemPrompt ? 'border-red-500' : ''}
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Instructions that guide the model&apos;s behavior and responses
              </p>
            </div>

            {/* Stop Sequences */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Stop Sequences
              </label>
              <Input
                type="text"
                value={config.stopSequences?.join(', ') || ''}
                onChange={(e) => {
                  const sequences = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  handleConfigChange('stopSequences', sequences);
                }}
                placeholder="\\n, END, STOP"
                className={errors.stopSequences ? 'border-red-500' : ''}
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Comma-separated list of sequences where the model should stop generating
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportConfig}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export
              </Button>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  className="hidden"
                  id={`import-config-${model.id}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImportClick}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Import
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}