'use client';

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { 
  Settings, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Zap,
  Info,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tooltip } from '../ui/tooltip';
import type { OpenRouterModel } from '../../lib/stores/types';

interface OpenRouterModelCardProps {
  model: OpenRouterModel;
  selected?: boolean;
  onSelect?: (provider: 'openrouter', modelId: string) => void;
  onConfigure?: (model: OpenRouterModel) => void;
  className?: string;
  showAvailability?: boolean;
}

const providerColors: Record<string, string> = {
  openai: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  anthropic: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  google: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  meta: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  mistralai: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  cohere: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

function formatPrice(priceStr: number | undefined): string {
  if (!priceStr || priceStr === 0) return 'Free';
  
  const price = typeof priceStr === 'string' ? parseFloat(priceStr) : priceStr;
  
  if (price < 0.01) {
    return `$${(price * 1000).toFixed(3)}/1M`;
  } else if (price < 1) {
    return `$${price.toFixed(3)}/1M`;
  } else {
    return `$${price.toFixed(2)}/1M`;
  }
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${Math.round(tokens / 1000)}K`;
  } else {
    return `${tokens}`;
  }
}

function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    meta: 'Meta',
    mistralai: 'Mistral AI',
    cohere: 'Cohere',
    'x-ai': 'xAI',
    'microsoft': 'Microsoft',
    'huggingface': 'Hugging Face',
  };
  return names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function OpenRouterModelCard({
  model,
  selected = false,
  onSelect,
  onConfigure,
  className,
  showAvailability = true
}: OpenRouterModelCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate pricing information
  const pricingInfo = useMemo(() => {
    if (!model.pricing) {
      return { input: 'Free', output: 'Free', avgPrice: 0, tier: 'free' as const };
    }

    const inputPrice = model.pricing.input || 0;
    const outputPrice = model.pricing.output || 0;
    const avgPrice = (inputPrice + outputPrice) / 2;

    let tier: 'free' | 'cheap' | 'moderate' | 'expensive' = 'free';
    if (avgPrice === 0) tier = 'free';
    else if (avgPrice < 1) tier = 'cheap';
    else if (avgPrice < 10) tier = 'moderate';
    else tier = 'expensive';

    return {
      input: formatPrice(inputPrice),
      output: formatPrice(outputPrice),
      avgPrice,
      tier
    };
  }, [model.pricing]);

  const pricingColor = {
    free: 'text-green-600 dark:text-green-400',
    cheap: 'text-blue-600 dark:text-blue-400',
    moderate: 'text-yellow-600 dark:text-yellow-400',
    expensive: 'text-red-600 dark:text-red-400'
  }[pricingInfo.tier];

  const handleSelect = () => {
    onSelect?.('openrouter', model.id);
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfigure?.(model);
  };

  const providerColorClass = providerColors[model.originalProvider] || providerColors.default;
  const availabilityStatus = model.availability;

  return (
    <div
      className={clsx(
        'relative group border rounded-lg p-4 transition-all duration-200 cursor-pointer',
        'hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600',
        selected 
          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        className
      )}
      onClick={handleSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {model.name}
            </h3>
            {model.isNew && (
              <Badge variant="success" size="xs">
                New
              </Badge>
            )}
          </div>
          
          {/* Provider and model ID */}
          <div className="flex items-center gap-2 mb-2">
            <Badge className={clsx('text-xs', providerColorClass)}>
              {getProviderDisplayName(model.originalProvider)}
            </Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
              {model.id}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          {showAvailability && availabilityStatus && (
            <Tooltip content={
              availabilityStatus.available 
                ? availabilityStatus.queued 
                  ? `Available - ${availabilityStatus.queued} queued`
                  : 'Available now'
                : availabilityStatus.error || 'Currently unavailable'
            }>
              <div className={clsx(
                'w-2 h-2 rounded-full',
                availabilityStatus.available
                  ? availabilityStatus.queued && availabilityStatus.queued > 10
                    ? 'bg-yellow-400'
                    : 'bg-green-400'
                  : 'bg-red-400'
              )} />
            </Tooltip>
          )}
          
          <Button
            variant="ghost"
            size="iconSm"
            onClick={handleConfigure}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Model Description */}
      {model.description && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {model.description}
        </p>
      )}

      {/* Specifications */}
      <div className="space-y-2 mb-3">
        {/* Context Window */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Context</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {formatContextWindow(model.contextWindow)} tokens
          </span>
        </div>

        {/* Max Output */}
        {model.maxTokens && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Max Output</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {formatContextWindow(model.maxTokens)} tokens
            </span>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Pricing
          </span>
          {pricingInfo.tier === 'free' ? (
            <Badge variant="success" size="xs">Free</Badge>
          ) : (
            <Badge 
              variant={pricingInfo.tier === 'expensive' ? 'destructive' : 'secondary'} 
              size="xs"
            >
              {pricingInfo.tier}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Input</span>
            <span className={clsx('font-medium', pricingColor)}>
              {pricingInfo.input}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Output</span>
            <span className={clsx('font-medium', pricingColor)}>
              {pricingInfo.output}
            </span>
          </div>
        </div>
      </div>

      {/* Queue Information */}
      {availabilityStatus?.queued && availabilityStatus.queued > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
          <Clock className="h-3 w-3" />
          <span>{availabilityStatus.queued} requests queued</span>
        </div>
      )}

      {/* Capabilities */}
      {model.capabilities && model.capabilities.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {model.capabilities.slice(0, 3).map((capability) => (
              <Badge 
                key={capability} 
                variant="outline" 
                size="xs"
                className="text-xs"
              >
                {capability.replace('-', ' ')}
              </Badge>
            ))}
            {model.capabilities.length > 3 && (
              <Badge variant="outline" size="xs" className="text-xs">
                +{model.capabilities.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      )}

      {/* Hover Effect */}
      {isHovered && !selected && (
        <div className="absolute inset-0 border-2 border-blue-300 dark:border-blue-600 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}


export default OpenRouterModelCard;
