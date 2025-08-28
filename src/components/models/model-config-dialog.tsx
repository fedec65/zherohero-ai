'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { Model, CustomModel, ModelConfig } from '../../../lib/stores/types';

interface ModelConfigDialogProps {
  model: Model | CustomModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSave?: (modelId: string, config: ModelConfig) => void;
}

// Default model configuration values
const DEFAULT_CONFIG: ModelConfig = {
  temperature: 1.0,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  maxTokens: undefined,
};

interface SliderControlProps {
  label: string;
  value: number | undefined;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  description: string;
  onChange: (value: number | undefined) => void;
}

function SliderControl({ 
  label, 
  value, 
  defaultValue, 
  min, 
  max, 
  step, 
  description, 
  onChange 
}: SliderControlProps) {
  const isDefault = value === undefined || value === defaultValue;
  const displayValue = isDefault ? defaultValue : value;

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue === defaultValue ? undefined : newValue);
  }, [defaultValue, onChange]);

  const handleReset = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        {isDefault ? (
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
            DEFAULT
          </span>
        ) : (
          <button 
            onClick={handleReset}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Reset
          </button>
        )}
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{min}</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {displayValue.toFixed(step < 1 ? 1 : 0)}
          </span>
          <span>{max}</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

export function ModelConfigDialog({ 
  model, 
  open, 
  onOpenChange,
  onConfigSave 
}: ModelConfigDialogProps) {
  const [config, setConfig] = useState<ModelConfig>(() => ({ ...DEFAULT_CONFIG }));
  const [hasChanges, setHasChanges] = useState(false);

  // Reset config when dialog opens
  useEffect(() => {
    if (open) {
      setConfig({ ...DEFAULT_CONFIG });
      setHasChanges(false);
    }
  }, [open]);

  const handleConfigChange = useCallback((field: keyof ModelConfig, value: number | string | undefined) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    onConfigSave?.(model.id, config);
    setHasChanges(false);
    onOpenChange(false);
  }, [config, model.id, onConfigSave, onOpenChange]);

  const handleReset = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG });
    setHasChanges(false);
  }, []);

  const handleCancel = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG });
    setHasChanges(false);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {model.name} Settings
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure model parameters. Leave empty to use defaults.
            </p>
          </DialogHeader>
          
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Temperature */}
          <SliderControl
            label="Temperature"
            value={config.temperature}
            defaultValue={DEFAULT_CONFIG.temperature}
            min={0}
            max={2}
            step={0.1}
            description="Higher values make output more random, lower values more focused and deterministic"
            onChange={(value) => handleConfigChange('temperature', value)}
          />
          
          {/* Presence Penalty */}
          <SliderControl
            label="Presence Penalty"
            value={config.presencePenalty}
            defaultValue={DEFAULT_CONFIG.presencePenalty}
            min={-2}
            max={2}
            step={0.1}
            description="Penalizes new tokens based on whether they appear in the text so far"
            onChange={(value) => handleConfigChange('presencePenalty', value)}
          />
          
          {/* Frequency Penalty */}
          <SliderControl
            label="Frequency Penalty"
            value={config.frequencyPenalty}
            defaultValue={DEFAULT_CONFIG.frequencyPenalty}
            min={-2}
            max={2}
            step={0.1}
            description="Penalizes new tokens based on their frequency in the text so far"
            onChange={(value) => handleConfigChange('frequencyPenalty', value)}
          />
          
          {/* Top P */}
          <SliderControl
            label="Top P"
            value={config.topP}
            defaultValue={DEFAULT_CONFIG.topP}
            min={0}
            max={1}
            step={0.05}
            description="Nucleus sampling: model considers tokens with top_p probability mass"
            onChange={(value) => handleConfigChange('topP', value)}
          />
          
          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Max Tokens
              </label>
              {config.maxTokens === undefined ? (
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  DEFAULT
                </span>
              ) : (
                <button 
                  onClick={() => handleConfigChange('maxTokens', undefined)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Reset
                </button>
              )}
            </div>
            
            <Input
              type="number"
              value={config.maxTokens ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : Number(e.target.value);
                handleConfigChange('maxTokens', value);
              }}
              placeholder="DEFAULT"
              min={1}
              max={100000}
              className="w-full"
            />
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maximum number of tokens to generate
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Reset to Defaults
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </Button>
            
            <Button
              variant="primary"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}