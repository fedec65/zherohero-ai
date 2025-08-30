/**
 * Add Custom MCP Server Dialog Component
 * Modal dialog for adding and configuring custom MCP servers
 */
'use client'

import React, { useState } from 'react'
import {
  Plus,
  Server,
  Link as LinkIcon,
  FileText,
  Key,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { MCPCapability } from '../../lib/stores/types/index'
import { useMCPStore } from '../../lib/stores/mcp-store'

interface AddMCPServerDialogProps {
  open: boolean
  onClose: () => void
}

interface ServerForm {
  name: string
  description: string
  url: string
  capabilities: MCPCapability[]
  config: {
    apiKey?: string
    timeout?: number
    retryAttempts?: number
  }
  enabled: boolean
  autoInject: boolean
}

const defaultForm: ServerForm = {
  name: '',
  description: '',
  url: '',
  capabilities: [],
  config: {
    timeout: 5000,
    retryAttempts: 3,
  },
  enabled: false,
  autoInject: false,
}

const availableCapabilities: {
  id: MCPCapability
  label: string
  description: string
}[] = [
  { id: 'tools', label: 'Tools', description: 'Execute functions and tools' },
  {
    id: 'resources',
    label: 'Resources',
    description: 'Access external resources',
  },
  { id: 'prompts', label: 'Prompts', description: 'Provide prompt templates' },
  {
    id: 'logging',
    label: 'Logging',
    description: 'Log interactions and events',
  },
]

export function AddMCPServerDialog({ open, onClose }: AddMCPServerDialogProps) {
  const [form, setForm] = useState<ServerForm>(defaultForm)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const { addCustomServer, testConnection, validateServerConfig, loading } =
    useMCPStore()

  const updateForm = (updates: Partial<ServerForm>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const updateConfig = (configUpdates: Partial<ServerForm['config']>) => {
    setForm((prev) => ({
      ...prev,
      config: { ...prev.config, ...configUpdates },
    }))
  }

  const toggleCapability = (capability: MCPCapability) => {
    setForm((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter((cap) => cap !== capability)
        : [...prev.capabilities, capability],
    }))
  }

  const handleTestConnection = async () => {
    if (!form.url.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a server URL first.',
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      // Create a temporary server object for testing
      const tempServer = {
        name: form.name || 'Test Server',
        description: form.description,
        url: form.url,
        enabled: true,
        autoInject: false,
        capabilities: form.capabilities,
        config: form.config,
      }

      const validation = validateServerConfig(tempServer)
      if (!validation.isValid) {
        setTestResult({
          success: false,
          message: `Invalid configuration: ${validation.errors.join(', ')}`,
        })
        return
      }

      // TODO: In a real implementation, this would test the actual MCP server
      // For now, we'll simulate a connection test
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      )

      const success = Math.random() > 0.3 // 70% success rate for demo

      setTestResult({
        success,
        message: success
          ? 'Connection successful! Server is responding correctly.'
          : 'Connection failed. Please check the URL and server configuration.',
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim() || !form.url.trim()) {
      setTestResult({
        success: false,
        message: 'Please fill in all required fields.',
      })
      return
    }

    try {
      await addCustomServer({
        name: form.name.trim(),
        description: form.description.trim(),
        url: form.url.trim(),
        capabilities: form.capabilities,
        config: form.config,
        enabled: form.enabled,
        autoInject: form.autoInject,
      })

      // Reset form and close dialog
      setForm(defaultForm)
      setTestResult(null)
      onClose()
    } catch (error) {
      setTestResult({
        success: false,
        message: `Failed to add server: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  const handleClose = () => {
    setForm(defaultForm)
    setTestResult(null)
    onClose()
  }

  const isFormValid =
    form.name.trim() && form.url.trim() && form.capabilities.length > 0

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add Custom MCP Server
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure a new Model Context Protocol server
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="server-name"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Server Name *
                </label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="server-name"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="My Custom MCP Server"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="server-description"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="server-description"
                    value={form.description}
                    onChange={(e) =>
                      updateForm({ description: e.target.value })
                    }
                    placeholder="Brief description of what this server provides..."
                    className="min-h-[80px] pl-10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="server-url"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Server URL *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="server-url"
                    type="url"
                    value={form.url}
                    onChange={(e) => updateForm({ url: e.target.value })}
                    placeholder="wss://example.com/mcp or http://localhost:3000/mcp"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Capabilities *
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {availableCapabilities.map((capability) => (
                  <button
                    key={capability.id}
                    type="button"
                    onClick={() => toggleCapability(capability.id)}
                    className={`
                  rounded-lg border-2 p-3 text-left transition-all
                  ${
                    form.capabilities.includes(capability.id)
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }
                `}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex-shrink-0">
                        {form.capabilities.includes(capability.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {capability.label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {capability.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Configuration
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="api-key"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    API Key (if required)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="api-key"
                      type="password"
                      value={form.config.apiKey || ''}
                      onChange={(e) => updateConfig({ apiKey: e.target.value })}
                      placeholder="Optional API key"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="timeout"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Timeout (ms)
                  </label>
                  <Input
                    id="timeout"
                    type="number"
                    value={form.config.timeout || 5000}
                    onChange={(e) =>
                      updateConfig({ timeout: parseInt(e.target.value) })
                    }
                    min="1000"
                    max="30000"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Settings
              </h3>

              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => updateForm({ enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Enable server on creation
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Automatically connect to the server after adding it
                    </div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.autoInject}
                    onChange={(e) =>
                      updateForm({ autoInject: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Auto-inject into conversations
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Automatically include this server in AI model requests
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`
            flex items-start gap-2 rounded-lg p-3
            ${
              testResult.success
                ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }
          `}
              >
                {testResult.success ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                )}
                <p
                  className={`
              text-sm 
              ${
                testResult.success
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }
            `}
                >
                  {testResult.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={!form.url.trim() || isTesting}
                leftIcon={
                  isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : undefined
                }
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>

              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={!isFormValid || loading.addServer}
                  loading={loading.addServer}
                >
                  Add Server
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
