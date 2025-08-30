'use client'

import React, { useState, useCallback } from 'react'
import { X, Globe, Check, AlertCircle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Dialog } from '../ui/dialog'
import { useModelStore } from '../../lib/stores/model-store'
import type { CustomModel, ModelCapability } from '../../lib/stores/types'

interface AddCustomModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  name: string
  apiEndpoint: string
  apiKeyRequired: boolean
  contextWindow: number
  maxTokens: number
  description: string
  capabilities: ModelCapability[]
  headers: Record<string, string>
}

const defaultFormData: FormData = {
  name: '',
  apiEndpoint: '',
  apiKeyRequired: true,
  contextWindow: 4096,
  maxTokens: 2048,
  description: '',
  capabilities: ['text-generation'],
  headers: {},
}

const availableCapabilities: { value: ModelCapability; label: string }[] = [
  { value: 'text-generation', label: 'Text Generation' },
  { value: 'code-generation', label: 'Code Generation' },
  { value: 'image-understanding', label: 'Image Understanding' },
  { value: 'function-calling', label: 'Function Calling' },
  { value: 'json-mode', label: 'JSON Mode' },
  { value: 'streaming', label: 'Streaming' },
]

export function AddCustomModelDialog({
  open,
  onOpenChange,
}: AddCustomModelDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false)
  const [endpointTestResult, setEndpointTestResult] = useState<
    'success' | 'error' | null
  >(null)

  const { addCustomModel, loading } = useModelStore((state) => ({
    addCustomModel: state.addCustomModel,
    loading: state.loading.addCustomModel,
  }))

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Model name is required'
    }

    if (!formData.apiEndpoint.trim()) {
      newErrors.apiEndpoint = 'API endpoint is required'
    } else {
      try {
        new URL(formData.apiEndpoint)
      } catch {
        newErrors.apiEndpoint = 'Please enter a valid URL'
      }
    }

    if (formData.contextWindow <= 0) {
      newErrors.contextWindow = 'Context window must be greater than 0'
    }

    if (formData.maxTokens <= 0) {
      newErrors.maxTokens = 'Max tokens must be greater than 0'
    }

    if (formData.capabilities.length === 0) {
      newErrors.capabilities = 'At least one capability must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const testApiEndpoint = useCallback(async () => {
    if (!formData.apiEndpoint) return

    setIsTestingEndpoint(true)
    setEndpointTestResult(null)

    try {
      // Simple connectivity test - try to reach the endpoint
      const response = await fetch(formData.apiEndpoint, {
        method: 'HEAD',
        mode: 'no-cors',
      })
      setEndpointTestResult('success')
    } catch (error) {
      setEndpointTestResult('error')
    } finally {
      setIsTestingEndpoint(false)
    }
  }, [formData.apiEndpoint])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) return

      try {
        const customModel: Omit<CustomModel, 'id'> = {
          name: formData.name.trim(),
          provider: 'custom',
          contextWindow: formData.contextWindow,
          maxTokens: formData.maxTokens,
          capabilities: formData.capabilities,
          apiEndpoint: formData.apiEndpoint.trim(),
          apiKeyRequired: formData.apiKeyRequired,
          headers: formData.headers,
        }

        await addCustomModel(customModel)

        // Reset form and close dialog
        setFormData(defaultFormData)
        setErrors({})
        setEndpointTestResult(null)
        onOpenChange(false)
      } catch (error) {
        console.error('Failed to add custom model:', error)
        setErrors({ submit: 'Failed to add model. Please try again.' })
      }
    },
    [formData, validateForm, addCustomModel, onOpenChange]
  )

  const handleInputChange = useCallback(
    (field: keyof FormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }))
      }
    },
    [errors]
  )

  const handleCapabilityToggle = useCallback((capability: ModelCapability) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter((c) => c !== capability)
        : [...prev.capabilities, capability],
    }))
  }, [])

  const handleClose = useCallback(() => {
    setFormData(defaultFormData)
    setErrors({})
    setEndpointTestResult(null)
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="relative max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Custom Model
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect to your own AI model or third-party service
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Model Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Model Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., My Custom GPT"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                className={clsx(
                  errors.name && 'border-red-300 dark:border-red-700'
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            {/* API Endpoint */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Endpoint *
              </label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://api.example.com/v1/chat/completions"
                  value={formData.apiEndpoint}
                  onChange={(e) =>
                    handleInputChange('apiEndpoint', e.target.value)
                  }
                  error={errors.apiEndpoint}
                  className={clsx(
                    'flex-1',
                    errors.apiEndpoint && 'border-red-300 dark:border-red-700'
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testApiEndpoint}
                  disabled={!formData.apiEndpoint || isTestingEndpoint}
                  className="px-3"
                >
                  {isTestingEndpoint ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : endpointTestResult === 'success' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : endpointTestResult === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
              {errors.apiEndpoint && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.apiEndpoint}
                </p>
              )}
              {endpointTestResult === 'success' && (
                <p className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  Endpoint is reachable
                </p>
              )}
              {endpointTestResult === 'error' && (
                <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  Unable to reach endpoint
                </p>
              )}
            </div>

            {/* Context Window & Max Tokens */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Context Window *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="2000000"
                  placeholder="4096"
                  value={formData.contextWindow}
                  onChange={(e) =>
                    handleInputChange(
                      'contextWindow',
                      parseInt(e.target.value) || 0
                    )
                  }
                  error={errors.contextWindow}
                />
                {errors.contextWindow && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.contextWindow}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Tokens *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100000"
                  placeholder="2048"
                  value={formData.maxTokens}
                  onChange={(e) =>
                    handleInputChange(
                      'maxTokens',
                      parseInt(e.target.value) || 0
                    )
                  }
                  error={errors.maxTokens}
                />
                {errors.maxTokens && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.maxTokens}
                  </p>
                )}
              </div>
            </div>

            {/* API Key Required */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="apiKeyRequired"
                checked={formData.apiKeyRequired}
                onChange={(e) =>
                  handleInputChange('apiKeyRequired', e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
              />
              <label
                htmlFor="apiKeyRequired"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Requires API key authentication
              </label>
            </div>

            {/* Capabilities */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Capabilities *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableCapabilities.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={formData.capabilities.includes(value)}
                      onChange={() => handleCapabilityToggle(value)}
                      className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.capabilities && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.capabilities}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (Optional)
              </label>
              <Textarea
                placeholder="Describe your custom model..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                rows={3}
              />
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              leftIcon={
                loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : undefined
              }
            >
              {loading ? 'Adding Model...' : 'Add Model'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
