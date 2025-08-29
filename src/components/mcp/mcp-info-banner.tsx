/**
 * MCP Info Banner Component
 * Displays informational content about Model Context Protocol servers
 */
'use client';

import React, { useState } from 'react';
import { Info, X, Zap, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface MCPInfoBannerProps {
  dismissible?: boolean;
  className?: string;
}

export function MCPInfoBanner({ dismissible = false, className = '' }: MCPInfoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <div className={`relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 shadow-sm ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-2 right-2 w-16 h-16 bg-blue-600 rounded-full blur-2xl" />
        <div className="absolute bottom-2 left-2 w-12 h-12 bg-indigo-600 rounded-full blur-xl" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-blue-900 dark:text-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold">
                  Model Context Protocol (MCP) Servers
                </h3>
                <div className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                  Beta
                </div>
              </div>
              
              <p className="text-sm leading-relaxed mb-3 text-blue-800 dark:text-blue-200">
                MCP servers extend AI model capabilities by providing access to external tools, resources, and data sources. 
                When enabled, compatible servers are automatically injected into OpenAI API calls to enhance responses with 
                real-time information and specialized functionality.
              </p>
              
              <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Auto-injection enabled</span>
                </div>
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>OpenAI optimized</span>
                </div>
                <button 
                  className="flex items-center gap-1 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                  onClick={() => window.open('https://modelcontextprotocol.io', '_blank')}
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
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg"
                aria-label="Dismiss information banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}