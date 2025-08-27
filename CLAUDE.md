# ZheroHero Website Complete Implementation Plan

## Project Overview

This plan provides a comprehensive roadmap to create an exact copy of the MindDeck AI chat interface (https://www.minddeck.ai/) for deployment on Vercel. MindDeck is an advanced AI chat interface that supports multiple AI models (OpenAI, Anthropic, Google Gemini, xAI, DeepSeek) with features like parallel conversations, folder organization, and Model Context Protocol (MCP) server integration.

## 1. Technical Stack Analysis

### Frontend Framework
- **Next.js 13+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hooks** for state management

### Key Libraries & Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.263.1",
    "clsx": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "@headlessui/react": "^1.7.0",
    "framer-motion": "^10.0.0",
    "react-hot-toast": "^2.4.0",
    "react-markdown": "^8.0.0",
    "remark-gfm": "^3.0.0",
    "react-syntax-highlighter": "^15.5.0"
  }
}
```

## 2. Project Structure

```
minddeck-clone/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── models/
│   │   │   └── page.tsx
│   │   └── mcp-servers/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown.tsx
│   │   │   └── tooltip.tsx
│   │   ├── layout/
│   │   │   ├── sidebar-nav.tsx
│   │   │   ├── chat-sidebar.tsx
│   │   │   ├── main-content.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── chat/
│   │   │   ├── chat-interface.tsx
│   │   │   ├── message-list.tsx
│   │   │   ├── message-item.tsx
│   │   │   ├── chat-input.tsx
│   │   │   └── new-chat-buttons.tsx
│   │   ├── models/
│   │   │   ├── model-grid.tsx
│   │   │   ├── model-card.tsx
│   │   │   ├── model-tabs.tsx
│   │   │   └── model-config-dialog.tsx
│   │   └── mcp/
│   │       ├── mcp-server-list.tsx
│   │       ├── mcp-server-card.tsx
│   │       └── mcp-info-banner.tsx
│   ├── lib/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── api/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── gemini.ts
│   │   │   ├── xai.ts
│   │   │   └── deepseek.ts
│   │   └── stores/
│   │       ├── chat-store.ts
│   │       ├── model-store.ts
│   │       └── settings-store.ts
│   ├── styles/
│   │   └── globals.css
│   └── public/
│       ├── logos/
│       │   ├── openai.png
│       │   ├── anthropic.png
│       │   ├── gemini.jpeg
│       │   ├── xai.png
│       │   └── deepseek.png
│       ├── favicon.ico
│       ├── apple-touch-icon.png
│       ├── favicon-32x32.png
│       ├── favicon-16x16.png
│       └── site.webmanifest
```

## 3. Core Components Breakdown

### 3.1 Layout Structure

#### Sidebar Navigation (w-16, fixed)
- Chat icon (message-square)
- Models icon (brain) 
- MCP Servers icon (server)
- Theme toggle (moon/sun)
- User avatar (gradient background with initial)
- Tooltips on hover

#### Chat Sidebar (w-320, resizable)
- Search input with search icon
- "New Chat" button (blue)
- Secondary buttons (New Folder, Sort/Filter)
- Chat list (currently empty state: "No chat groups yet")
- "Starred" section at bottom

#### Main Content Area
- Header with hamburger menu, chat title, edit button, upgrade button
- Chat interface or settings pages
- Responsive design

### 3.2 Chat Interface Components

#### Empty State (Home Page)
- Centered layout with two buttons:
  - "New Chat" (blue, larger)
  - "New Incognito Chat" (purple, smaller with shield icon)

#### Chat Input Area
- Text input with placeholder
- Send button
- Model selector dropdown
- Attachment/file upload capabilities
- Voice input option

#### Message Display
- User messages (right-aligned)
- AI messages (left-aligned)
- Message actions (copy, edit, regenerate)
- Code syntax highlighting
- Markdown rendering

### 3.3 Models Page Components

#### Model Tabs
- Built-in Models (active by default)
- Custom Models
- Add Custom Model
- OpenRouter

#### Model Cards Grid
Responsive grid (1/2/3/4 columns based on screen size):
- Model name and context window
- Provider logo
- "New" badge for recent models
- Configure button with settings icon
- Hover effects and transitions

#### Model Providers Sections
1. **OpenAI** (22 models)
   - GPT-5 series (New)
   - O-series models
   - GPT-4.1 series
   - GPT-4o series
   - Legacy GPT-4
   - Codex Mini

2. **Anthropic** (10 models)
   - Claude Opus 4.1 (New)
   - Claude 4 series
   - Claude 3.7/3.5 Sonnet
   - Claude 3 series

3. **Gemini** (9 models)
   - Gemini 2.5 series
   - Gemini 2.0 series
   - Gemini 1.5 series

4. **xAI** (3 models)
   - Grok 4 (New)
   - Grok 3 series

5. **DeepSeek** (2 models)
   - DeepSeek Chat (New)
   - DeepSeek Reasoner (New)

### 3.4 MCP Servers Page Components

#### Info Banner
- Blue background with info icon
- Explanation of MCP servers
- Auto-injection into OpenAI calls note

#### Server Tabs
- Built-in Servers (active)
- Custom Servers
- Add Custom Server

#### Empty State
- Globe icon
- "No Built-in Servers Available" message
- Helper text

## 4. State Management Architecture

### 4.1 Chat Store (Zustand/Context)
```typescript
interface ChatStore {
  chats: Chat[]
  activeChat: string | null
  messages: Record<string, Message[]>
  isLoading: boolean
  searchQuery: string
  
  // Actions
  createChat: () => void
  deleteChat: (id: string) => void
  setActiveChat: (id: string) => void
  sendMessage: (content: string) => void
  updateMessage: (id: string, content: string) => void
}
```

### 4.2 Model Store
```typescript
interface ModelStore {
  models: Record<Provider, Model[]>
  selectedModel: string
  modelConfigs: Record<string, ModelConfig>
  
  // Actions
  setSelectedModel: (model: string) => void
  updateModelConfig: (model: string, config: ModelConfig) => void
}
```

### 4.3 Settings Store
```typescript
interface SettingsStore {
  theme: 'light' | 'dark' | 'system'
  sidebarWidth: number
  mcpServers: MCPServer[]
  
  // Actions
  setTheme: (theme: Theme) => void
  setSidebarWidth: (width: number) => void
  addMCPServer: (server: MCPServer) => void
}
```

## 5. Styling Implementation

### 5.1 Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          // ... complete gray scale
        },
        blue: {
          50: '#eff6ff',
          600: '#2563eb',
          700: '#1d4ed8',
          // ... complete blue scale
        },
      },
      width: {
        '16': '4rem',
        '320': '20rem',
      },
    },
  },
  plugins: [],
}
```

### 5.2 Key Styling Patterns

#### Dark Mode Support
- `dark:` prefix for all dark mode variants
- System theme detection
- Toggle between light/dark modes

#### Hover Effects
- `hover:bg-gray-100 dark:hover:bg-gray-800`
- `hover:shadow-lg`
- `transition-colors` for smooth animations

#### Focus States
- `focus:ring-2 focus:ring-blue-500`
- `focus:border-transparent`

#### Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Responsive grid layouts

## 6. Component Implementation Details

### 6.1 Sidebar Navigation Component

```typescript
export function SidebarNav() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', icon: MessageSquare, label: 'Chat' },
    { href: '/models', icon: Brain, label: 'Models' },
    { href: '/mcp-servers', icon: Server, label: 'MCP Servers' },
  ]
  
  return (
    <div className="w-16 h-full bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-4 border-r border-gray-200 dark:border-gray-800">
      {/* Navigation items */}
      <div className="flex-1 flex flex-col items-center space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname === item.href}
          />
        ))}
      </div>
      
      {/* Bottom section */}
      <div className="flex flex-col items-center space-y-3 pb-2">
        <ThemeToggle />
        <UserAvatar />
      </div>
    </div>
  )
}
```

### 6.2 Model Card Component

```typescript
interface ModelCardProps {
  model: {
    name: string
    contextWindow: string
    isNew?: boolean
    provider: string
  }
}

export function ModelCard({ model }: ModelCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
            {model.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {model.contextWindow}
          </p>
        </div>
        {model.isNew && (
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
            New
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <button className="ml-auto text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Configure
        </button>
      </div>
    </div>
  )
}
```

## 7. API Integration Architecture

### 7.1 AI Provider Integrations

#### OpenAI Integration
```typescript
export class OpenAIClient {
  private apiKey: string
  private baseURL = 'https://api.openai.com/v1'
  
  async createChatCompletion(params: ChatCompletionParams) {
    // Implementation
  }
  
  async streamChatCompletion(params: ChatCompletionParams) {
    // Streaming implementation
  }
}
```

#### Similar patterns for Anthropic, Gemini, xAI, DeepSeek

### 7.2 Model Context Protocol (MCP) Integration
```typescript
interface MCPServer {
  id: string
  name: string
  url: string
  enabled: boolean
  capabilities: string[]
}

export class MCPManager {
  private servers: Map<string, MCPServer> = new Map()
  
  async addServer(server: MCPServer) {
    // Implementation
  }
  
  async removeServer(id: string) {
    // Implementation
  }
  
  async injectIntoCompletion(messages: Message[]) {
    // Auto-injection into OpenAI calls
  }
}
```

## 8. Features Implementation Roadmap

### Phase 1: Core Layout & Navigation
- [ ] Basic Next.js setup with TypeScript
- [ ] Tailwind CSS configuration
- [ ] Sidebar navigation with routing
- [ ] Chat sidebar with search
- [ ] Theme toggle functionality
- [ ] Responsive layout

### Phase 2: Chat Interface
- [ ] Empty state with new chat buttons
- [ ] Basic chat interface
- [ ] Message components
- [ ] Chat input with send functionality
- [ ] Local chat storage

### Phase 3: Models Management
- [ ] Models page with tabs
- [ ] Model cards grid
- [ ] Model configuration dialogs
- [ ] Provider logos and branding
- [ ] Search functionality

### Phase 4: AI Integration
- [ ] OpenAI API integration
- [ ] Anthropic Claude integration
- [ ] Google Gemini integration
- [ ] xAI Grok integration
- [ ] DeepSeek integration
- [ ] Streaming responses

### Phase 5: MCP Servers
- [ ] MCP servers page
- [ ] Custom server addition
- [ ] Server management
- [ ] Auto-injection into API calls

### Phase 6: Advanced Features
- [ ] Folder organization
- [ ] Chat search and filtering
- [ ] Incognito chat mode
- [ ] Starred conversations
- [ ] Export/import functionality

### Phase 7: Polish & Optimization
- [ ] Loading states and animations
- [ ] Error handling
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility improvements

## 9. Deployment Configuration

### 9.1 Vercel Configuration
```json
{
  "name": "minddeck-clone",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "GOOGLE_API_KEY": "@google-api-key",
    "XAI_API_KEY": "@xai-api-key",
    "DEEPSEEK_API_KEY": "@deepseek-api-key"
  }
}
```

### 9.2 Environment Variables
```env
# API Keys (to be configured in Vercel dashboard)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
XAI_API_KEY=your_xai_key
DEEPSEEK_API_KEY=your_deepseek_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_GA_ID=your_analytics_id
```

## 10. Key Implementation Notes

### 10.1 Exact Visual Replication
- Use exact color values from the original site
- Implement precise spacing and typography
- Match hover effects and transitions
- Replicate all icons using Lucide React
- Maintain responsive behavior

### 10.2 State Persistence
- Store chat history in localStorage
- Persist model configurations
- Save theme preferences
- Maintain sidebar width settings

### 10.3 Performance Considerations
- Implement lazy loading for model cards
- Use React.memo for expensive components
- Optimize bundle size with dynamic imports
- Implement proper error boundaries

### 10.4 Security Best Practices
- Store API keys server-side only
- Implement rate limiting
- Validate all inputs
- Use HTTPS for all API calls

## 11. Testing Strategy

### 11.1 Unit Testing
- Component testing with Jest & React Testing Library
- API integration testing
- State management testing

### 11.2 Integration Testing
- End-to-end testing with Playwright
- API endpoint testing
- Cross-browser compatibility testing

### 11.3 Performance Testing
- Lighthouse audits
- Bundle size analysis
- API response time monitoring

## 12. Maintenance & Updates

### 12.1 Model Updates
- Regular addition of new models
- Configuration updates
- Provider API changes

### 12.2 Feature Enhancements
- User feedback implementation
- Performance improvements
- Security updates

This comprehensive plan provides the exact roadmap needed to create a complete replica of the MindDeck website with all its functionality. Each component and feature has been analyzed and documented for precise implementation.