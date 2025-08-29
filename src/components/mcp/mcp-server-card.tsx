/**
 * MCP Server Card Component
 * Displays individual MCP server information with controls
 */
'use client';

import React, { useState } from 'react';
import { 
  Server, 
  Settings, 
  Power,
  PowerOff,
  Trash2, 
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tooltip } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { MCPServer, MCPCapability } from '../../lib/stores/types/index';
import { useMCPStore } from '../../lib/stores/mcp-store';
import { useSettingsStore } from '../../lib/stores/settings-store';

interface MCPServerCardProps {
  server: MCPServer;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onEdit?: (server: MCPServer) => void;
  onDuplicate?: (server: MCPServer) => void;
  onDelete?: (server: MCPServer) => void;
  isBuiltin?: boolean;
  className?: string;
}

export function MCPServerCard({
  server,
  connectionStatus,
  onEdit,
  onDuplicate,
  onDelete,
  isBuiltin = false,
  className = ''
}: MCPServerCardProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const {
    toggleServerEnabled,
    connectServer,
    disconnectServer,
    testConnection,
    updateServerConfig,
    loading
  } = useMCPStore();

  const { getApiKey, setApiKey: setSettingsApiKey, hasApiKey } = useSettingsStore();
  
  // Get API key from settings store for Tavily
  const currentApiKey = server.name === 'Tavily Search' ? getApiKey('tavily') || '' : '';
  const [apiKey, setApiKey] = useState(currentApiKey);

  const isLoading = loading.testConnection;
  const isConnecting = connectionStatus === 'connecting';
  const isConnected = connectionStatus === 'connected';
  const hasError = connectionStatus === 'error';

  const handleToggleEnabled = async () => {
    toggleServerEnabled(server.id, !server.enabled);
  };

  const handleTestConnection = async () => {
    try {
      const success = await testConnection(server.id);
      console.log(`Connection test ${success ? 'succeeded' : 'failed'} for server ${server.name}`);
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (apiKey.trim()) {
      // Save to settings store for Tavily servers
      if (server.name === 'Tavily Search') {
        setSettingsApiKey('tavily', apiKey.trim());
        // Trigger server instance update to use new API key
        await updateServerConfig(server.id, {});
      } else {
        updateServerConfig(server.id, { apiKey: apiKey.trim() });
      }
      setIsConfiguring(false);
    }
  };

  const getStatusIcon = () => {
    if (isConnecting || isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (hasError) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    if (hasError) return 'Error';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-blue-600 dark:text-blue-400';
    if (isConnected) return 'text-green-600 dark:text-green-400';
    if (hasError) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const capabilityLabels: Record<MCPCapability, string> = {
    tools: 'Tools',
    resources: 'Resources',
    prompts: 'Prompts',
    logging: 'Logging'
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 
      hover:shadow-lg transition-all duration-200 ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Server className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
              {server.name}
            </h3>
            {isBuiltin && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Built-in
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {server.description}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{server.url}</span>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <Tooltip content={server.enabled ? 'Disable server' : 'Enable server'}>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={handleToggleEnabled}
            className={`
              flex-shrink-0 ml-2
              ${server.enabled 
                ? 'text-green-600 hover:text-green-700 dark:text-green-400' 
                : 'text-gray-400 hover:text-gray-500'
              }
            `}
          >
            {server.enabled ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
          </Button>
        </Tooltip>
      </div>

      {/* Status and Capabilities */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {server.capabilities.map((capability) => (
            <Tooltip key={capability} content={capabilityLabels[capability]}>
              <Badge 
                variant="outline" 
                className="text-xs px-1.5 py-0.5"
              >
                {capability}
              </Badge>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* API Key Configuration (for servers that need it) */}
      {server.name === 'Tavily Search' && (
        <div className="mb-3">
          {isConfiguring ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Tavily API key..."
                  className="text-xs pr-8"
                />
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                >
                  {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              <Button 
                size="sm" 
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
                className="text-xs"
              >
                Save
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsConfiguring(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfiguring(true)}
              leftIcon={<Key className="h-3 w-3" />}
              className="text-xs"
            >
              {currentApiKey ? 'Update API Key' : 'Configure API Key'}
            </Button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Tooltip content="Test connection">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTestConnection}
              disabled={!server.enabled || isLoading}
              className="text-xs"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Test'
              )}
            </Button>
          </Tooltip>

          {onEdit && (
            <Tooltip content="Edit server">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => onEdit(server)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </Tooltip>
          )}

          {onDuplicate && !isBuiltin && (
            <Tooltip content="Duplicate server">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => onDuplicate(server)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </Tooltip>
          )}
        </div>

        {onDelete && !isBuiltin && (
          <Tooltip content="Delete server">
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => onDelete(server)}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}