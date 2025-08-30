'use client'

import React from 'react'
import { ExternalLink, Heart, Shield, FileText } from 'lucide-react'
import { cn } from '../../../lib/utils'

const APP_VERSION = '1.0.0'
const BUILD_DATE = new Date().toLocaleDateString()

export function AboutTab() {
  const links = [
    {
      title: 'Privacy Policy',
      href: '/privacy',
      icon: Shield,
      description: 'How we protect your data',
    },
    {
      title: 'Terms of Service',
      href: '/terms',
      icon: FileText,
      description: 'Legal terms and conditions',
    },
    {
      title: 'GitHub Repository',
      href: 'https://github.com/sandsiv/sandsiv-plus',
      icon: ExternalLink,
      description: 'Source code and contributions',
    },
    {
      title: 'Documentation',
      href: '/docs',
      icon: FileText,
      description: 'User guides and API docs',
    },
  ]

  const features = [
    'Multiple AI provider support',
    'Real-time streaming responses',
    'Local data storage',
    'Dark/light theme support',
    'Responsive design',
    'Keyboard shortcuts',
    'Import/export functionality',
    'Model Context Protocol (MCP) integration',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
          <span className="text-2xl font-bold text-white">S</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sandsiv+
          </h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Advanced AI Chat Interface
          </p>
        </div>
      </div>

      {/* Version Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {APP_VERSION}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Version
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {BUILD_DATE}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last Updated
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
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
          About Sandsiv+
        </h3>
        <p className="leading-relaxed text-gray-700 dark:text-gray-300">
          Sandsiv+ is a modern, privacy-focused AI chat interface that supports
          multiple AI providers including OpenAI, Anthropic Claude, Google
          Gemini, xAI, and DeepSeek. Built with performance and user experience
          in mind, Sandsiv+ offers a seamless way to interact with cutting-edge
          AI models while keeping your data secure and private.
        </p>
        <p className="leading-relaxed text-gray-700 dark:text-gray-300">
          All conversations and settings are stored locally in your browser,
          ensuring complete privacy. Your API keys are never transmitted to our
          servers and are only used for direct communication with your chosen AI
          providers.
        </p>
      </div>

      {/* Key Features */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Key Features
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <a
                key={link.title}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : '_self'}
                rel={
                  link.href.startsWith('http')
                    ? 'noopener noreferrer'
                    : undefined
                }
                className={cn(
                  'rounded-lg border border-gray-200 p-4 dark:border-gray-700',
                  'hover:border-blue-300 dark:hover:border-blue-600',
                  'hover:bg-blue-50 dark:hover:bg-blue-900/20',
                  'group transition-colors'
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 text-gray-600 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {link.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {link.description}
                    </p>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>

      {/* Credits */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Acknowledgments
        </h3>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            Sandsiv+ is built with modern web technologies including Next.js,
            TypeScript, Tailwind CSS, and integrates with multiple AI providers.
            We thank the open source community for their contributions to the
            tools and libraries that make this project possible.
          </p>

          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
            <p className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              Made with <Heart className="h-4 w-4 text-red-500" /> for the AI
              community
            </p>
          </div>
        </div>
      </div>

      {/* Technical Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Technical Information
        </h3>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Framework
              </span>
              <span className="text-gray-900 dark:text-white">Next.js 14</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Language</span>
              <span className="text-gray-900 dark:text-white">TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Styling</span>
              <span className="text-gray-900 dark:text-white">
                Tailwind CSS
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                State Management
              </span>
              <span className="text-gray-900 dark:text-white">Zustand</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Icons</span>
              <span className="text-gray-900 dark:text-white">
                Lucide React
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Storage</span>
              <span className="text-gray-900 dark:text-white">
                Local Storage
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200 py-6 text-center dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} Sandsiv+. All rights reserved.
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          This software is provided under the MIT License.
        </p>
      </div>
    </div>
  )
}
