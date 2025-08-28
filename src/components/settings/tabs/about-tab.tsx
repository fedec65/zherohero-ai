'use client';

import React from 'react';
import { ExternalLink, Heart, Shield, FileText } from 'lucide-react';
import { cn } from '../../../lib/utils';

const APP_VERSION = '1.0.0';
const BUILD_DATE = new Date().toLocaleDateString();

export function AboutTab() {
  const links = [
    {
      title: 'Privacy Policy',
      href: '/privacy',
      icon: Shield,
      description: 'How we protect your data'
    },
    {
      title: 'Terms of Service',
      href: '/terms',
      icon: FileText,
      description: 'Legal terms and conditions'
    },
    {
      title: 'GitHub Repository',
      href: 'https://github.com/minddeck/minddeck-ai',
      icon: ExternalLink,
      description: 'Source code and contributions'
    },
    {
      title: 'Documentation',
      href: '/docs',
      icon: FileText,
      description: 'User guides and API docs'
    }
  ];

  const features = [
    'Multiple AI provider support',
    'Real-time streaming responses',
    'Local data storage',
    'Dark/light theme support',
    'Responsive design',
    'Keyboard shortcuts',
    'Import/export functionality',
    'Model Context Protocol (MCP) integration'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold text-white">M</span>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            MindDeck AI
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Advanced AI Chat Interface
          </p>
        </div>
      </div>

      {/* Version Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {APP_VERSION}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Version
          </div>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {BUILD_DATE}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last Updated
          </div>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Stable
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Release Channel
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          About MindDeck
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          MindDeck is a modern, privacy-focused AI chat interface that supports multiple AI providers 
          including OpenAI, Anthropic Claude, Google Gemini, xAI, and DeepSeek. Built with performance 
          and user experience in mind, MindDeck offers a seamless way to interact with cutting-edge 
          AI models while keeping your data secure and private.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          All conversations and settings are stored locally in your browser, ensuring complete privacy. 
          Your API keys are never transmitted to our servers and are only used for direct communication 
          with your chosen AI providers.
        </p>
      </div>

      {/* Key Features */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.title}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : '_self'}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={cn(
                  "p-4 border border-gray-200 dark:border-gray-700 rounded-lg",
                  "hover:border-blue-300 dark:hover:border-blue-600",
                  "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                  "transition-colors group"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {link.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {link.description}
                    </p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Credits */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Acknowledgments
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            MindDeck is built with modern web technologies including Next.js, TypeScript, Tailwind CSS, 
            and integrates with multiple AI providers. We thank the open source community for their 
            contributions to the tools and libraries that make this project possible.
          </p>
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-red-500" /> for the AI community
            </p>
          </div>
        </div>
      </div>

      {/* Technical Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Technical Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Framework</span>
              <span className="text-gray-900 dark:text-white">Next.js 14</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Language</span>
              <span className="text-gray-900 dark:text-white">TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Styling</span>
              <span className="text-gray-900 dark:text-white">Tailwind CSS</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">State Management</span>
              <span className="text-gray-900 dark:text-white">Zustand</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Icons</span>
              <span className="text-gray-900 dark:text-white">Lucide React</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Storage</span>
              <span className="text-gray-900 dark:text-white">Local Storage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} MindDeck AI. All rights reserved.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          This software is provided under the MIT License.
        </p>
      </div>
    </div>
  );
}