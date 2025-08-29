# MCP (Model Context Protocol) Integration

This directory contains the complete implementation of MCP server integrations for MindDeck, starting with **Tavily Search** as the first built-in server.

## Overview

The Model Context Protocol (MCP) allows AI models to seamlessly access external tools and resources. Our implementation provides:

- **Auto-injection** into OpenAI API calls
- **Built-in servers** (Tavily Search) and custom server support
- **Real-time health monitoring** and connection management
- **Secure API key management** through the settings store
- **Performance monitoring** and usage statistics

## Architecture

### Core Components

1. **Services Layer** (`/services/`)
   - `tavily-search.ts` - Tavily API client with caching and error handling

2. **MCP Servers** (`/servers/`)
   - `tavily.ts` - MCP protocol implementation for Tavily Search

3. **Auto-injection System** (`/auto-injection.ts`)
   - Automatically adds MCP tools to OpenAI function calling
   - Processes tool calls and returns formatted results
   - Manages function call history and statistics

4. **Enhanced API Clients** (`/api/openai-mcp.ts`)
   - Extends base OpenAI client with MCP capabilities
   - Handles streaming and non-streaming completions
   - Provides fallback mechanisms

## Tavily Search Integration

### Features

- **Real-time web search** with configurable depth (basic/advanced)
- **Content extraction** from specific URLs
- **Image search** support
- **Domain filtering** (include/exclude specific domains)
- **Date-based filtering** for recent content
- **Topic-specific search** (general, news, finance, academic)
- **Response caching** with 5-minute TTL
- **Rate limiting** and error handling
- **Usage statistics** and quota monitoring

### API Key Setup

1. Get your Tavily API key from [Tavily.com](https://tavily.com)
2. Go to **Settings** in MindDeck
3. Add your API key under **API Keys → Tavily**
4. Navigate to **MCP Servers**
5. Enable the **Tavily Search** server
6. Test the connection

### Configuration Options

```typescript
interface TavilyConfig {
  apiKey: string;
  maxResults: number;          // 1-20, default: 10
  searchDepth: 'basic' | 'advanced'; // default: 'advanced'
  includeImages: boolean;      // default: false
  includeAnswer: boolean;      // default: true
  includeRawContent: boolean;  // default: false
  timeout: number;             // default: 30000ms
  cacheTTL: number;           // default: 300000ms (5 min)
}
```

### Available Tools

#### `tavily_search`
Searches the web for real-time information and content.

**Parameters:**
- `query` (required): Search query string
- `search_depth`: 'basic' | 'advanced'
- `max_results`: 1-20
- `include_answer`: boolean
- `include_images`: boolean
- `include_domains`: string[] (optional)
- `exclude_domains`: string[] (optional)
- `days`: number (filter by recent days)
- `topic`: 'general' | 'news' | 'finance' | 'academic'

#### `tavily_extract`
Extracts and summarizes content from specific URLs.

**Parameters:**
- `urls` (required): Array of URLs (max 5)
- `include_raw_content`: boolean

#### `tavily_get_usage`
Gets current API usage statistics and remaining quota.

## Auto-Injection with OpenAI

When Tavily Search is enabled with auto-injection, it automatically becomes available to OpenAI models through function calling:

```typescript
// This happens automatically - no code changes needed!
const response = await openai.createChatCompletion({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'What are the latest developments in AI?' }
  ]
});
// GPT-4 can now automatically search the web for current AI news
```

### How It Works

1. **Tool Injection**: MCP tools are automatically added to OpenAI function definitions
2. **Function Calling**: OpenAI decides when to use search tools based on user queries
3. **Tool Execution**: MCP server processes the function call
4. **Result Integration**: Search results are seamlessly integrated into the conversation
5. **Context Preservation**: Function call history is maintained per chat

## Usage Examples

### Basic Setup

```typescript
import { setupTavilySearch, testTavilyConnection } from '../lib/examples/tavily-usage';

// Setup Tavily with API key
await setupTavilySearch('tvly-your-api-key-here');

// Test connection
const isConnected = await testTavilyConnection();
console.log('Tavily connected:', isConnected);
```

### Chat with Web Search

```typescript
import { chatWithWebSearch } from '../lib/examples/tavily-usage';

const response = await chatWithWebSearch(
  'What are the latest developments in renewable energy technology?'
);
console.log(response); // AI response with current web search results
```

### Direct Tool Usage

```typescript
import { directTavilySearch } from '../lib/examples/tavily-usage';

const searchResult = await directTavilySearch('latest AI breakthroughs 2024');
console.log(searchResult.content); // Raw search results
```

### Advanced Search Examples

```typescript
import { searchExamples } from '../lib/examples/tavily-usage';

// Get current news
const news = await searchExamples.getCurrentNews('artificial intelligence');

// Research a topic thoroughly
const research = await searchExamples.researchTopic('quantum computing');

// Analyze specific website
const analysis = await searchExamples.analyzeWebsite(
  'https://example.com/article',
  'What are the main conclusions of this article?'
);
```

## Health Monitoring

### Connection Status

The system continuously monitors Tavily server health:

- **Connected**: Server is healthy and responding
- **Disconnected**: Server is disabled or not configured
- **Error**: Connection failed or API issues
- **Connecting**: Currently attempting connection

### Performance Metrics

```typescript
import { monitorMCPHealth } from '../lib/examples/tavily-usage';

const health = await monitorMCPHealth();
console.log({
  tavilyHealthy: health.tavilyHealthy,
  autoInjectionActive: health.autoInjectionActive,
  functionCallStats: health.stats
});
```

### Usage Statistics

```typescript
// Get function call statistics
const stats = autoInjectionManager.getFunctionCallStats();
console.log({
  totalCalls: stats.totalFunctionCalls,
  successRate: 1 - stats.errorRate,
  popularFunctions: stats.functionCounts,
});
```

## Error Handling

### Graceful Degradation

The system provides multiple fallback mechanisms:

1. **Cache Fallback**: Uses cached results when API is temporarily unavailable
2. **Retry Logic**: Automatic retries with exponential backoff
3. **OpenAI Fallback**: Continues without web search if MCP fails
4. **Error Context**: Provides helpful error messages to users

### Common Issues

#### API Key Issues
- **Invalid Key**: Check format (should start with `tvly-`)
- **Expired Key**: Renew your Tavily subscription
- **Rate Limited**: Reduce search frequency or upgrade plan

#### Connection Issues
- **Network Problems**: Check internet connectivity
- **Server Down**: Tavily API may be temporarily unavailable
- **Configuration**: Ensure server is enabled and API key is set

#### Performance Issues
- **Slow Responses**: Try reducing `max_results` or using 'basic' depth
- **Memory Usage**: Clear cache periodically in development
- **Rate Limits**: Implement client-side throttling

## Development

### Adding New MCP Servers

1. Create service client in `/services/your-service.ts`
2. Implement MCP server in `/servers/your-server.ts`
3. Add server configuration to `BUILT_IN_SERVERS` in mcp-store.ts
4. Update auto-injection manager to handle new server
5. Add UI components for configuration
6. Create usage examples and documentation

### Testing

```typescript
// Test individual components
import { TavilySearchClient } from '../services/tavily-search';
const client = new TavilySearchClient({ apiKey: 'test-key' });
const result = await client.testConnection();

// Test MCP server
import { TavilyMCPServer } from '../servers/tavily';
const server = new TavilyMCPServer(serverConfig);
await server.initialize();
const health = await server.healthCheck();

// Test auto-injection
import { autoInjectionManager } from '../mcp/auto-injection';
const stats = autoInjectionManager.getFunctionCallStats();
```

### Performance Optimization

- **Caching**: 5-minute TTL for search results
- **Connection Pooling**: Reuse HTTP connections
- **Request Batching**: Combine multiple requests when possible
- **Rate Limiting**: Respect API limits (10 requests/minute default)
- **Memory Management**: Automatic cache cleanup every minute

## Security

### API Key Protection

- API keys are stored securely in the settings store
- Keys are never exposed in logs or error messages
- Server-side validation prevents key leakage
- Keys are transmitted over HTTPS only

### Input Validation

- All search queries are validated and sanitized
- URL validation prevents malicious redirect attempts
- Request size limits prevent abuse
- Rate limiting protects against DoS attacks

### Data Privacy

- Search queries are not stored permanently
- Cache is cleared automatically after TTL
- Function call history is limited to 50 entries per chat
- No personal data is transmitted to Tavily without user consent

## Troubleshooting

### Enable Debug Logging

```typescript
// In browser console
localStorage.setItem('mcp-debug', 'true');
// Reload page to see detailed MCP logs
```

### Common Solutions

1. **Clear Cache**: `mcpStore.getTavilyServer('tavily-search')?.clearCache()`
2. **Reconnect**: Toggle server off and on in MCP Servers page
3. **Test Connection**: Use the "Test" button on server card
4. **Check API Key**: Verify format and validity in Settings
5. **Review Logs**: Check browser console for detailed error messages

### Support

For additional help:
1. Check the [Tavily API Documentation](https://docs.tavily.com)
2. Review the examples in `/lib/examples/tavily-usage.ts`
3. Enable debug logging for detailed error information
4. Test individual components to isolate issues

## Future Enhancements

### Planned Features

- **Google Search** MCP server
- **Wikipedia** content extraction
- **News API** integration
- **Social media** search (Twitter, Reddit)
- **Academic search** (arXiv, PubMed)
- **File upload** and analysis
- **Multimodal search** (images, videos)

### API Improvements

- **Streaming search** results
- **Background refresh** of cached results
- **Smart caching** based on query similarity
- **Cost optimization** through result deduplication
- **Multi-language** search support

### UI Enhancements

- **Search result** preview in chat
- **Source citation** links
- **Search confidence** indicators
- **Advanced filtering** UI
- **Usage dashboard** with analytics