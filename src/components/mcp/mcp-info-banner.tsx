/**
 * MCP Info Banner Component
 * Displays informational content about Model Context Protocol servers
 */
'use client'

import React, { useState } from 'react'
import { Info, X, Zap, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'

interface MCPInfoBannerProps {
  dismissible?: boolean
  className?: string
}

export function MCPInfoBanner({
  dismissible = false,
  className = '',
}: MCPInfoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return null
  }

  return (
    <div
      className={`relative mb-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20 ${className}`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute right-2 top-2 h-16 w-16 rounded-full bg-blue-600 blur-2xl" />
        <div className="absolute bottom-2 left-2 h-12 w-12 rounded-full bg-indigo-600 blur-xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-800/50">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-blue-900 dark:text-blue-100">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-base font-semibold">
                  Model Context Protocol (MCP) Servers
                </h3>
                <div className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                  Beta
                </div>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-blue-800 dark:text-blue-200">
                MCP servers extend AI model capabilities by providing access to
                external tools, resources, and data sources. When enabled,
                compatible servers are automatically injected into OpenAI API
                calls to enhance responses with real-time information and
                specialized functionality.
              </p>

              <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Auto-injection enabled</span>
                </div>
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>OpenAI optimized</span>
                </div>
                <button
                  className="flex items-center gap-1 transition-colors hover:text-blue-900 dark:hover:text-blue-100"
                  onClick={() =>
                    window.open('https://modelcontextprotocol.io', '_blank')
                  }
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Learn more</span>
                </button>
              </div>
            </div>
          </div>

          {dismissible && (
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setIsDismissed(true)}
                className="rounded-lg text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-800/30"
                aria-label="Dismiss information banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
