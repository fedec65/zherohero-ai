// Jest environment setup - load test environment variables
const { loadEnvConfig } = require('@next/env')

// Load environment variables for testing
loadEnvConfig(process.cwd(), true, {
  info: () => null,
  error: () => null,
})

// Set test-specific environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock API keys for testing (these are fake keys)
process.env.OPENAI_API_KEY = 'sk-test1234567890abcdefghijklmnopqrstuvwxyz'
process.env.ANTHROPIC_API_KEY =
  'sk-ant-test1234567890abcdefghijklmnopqrstuvwxyz12345'
process.env.GOOGLE_API_KEY = 'AIza-test-1234567890abcdefghijklmnopqrstuvw'
process.env.XAI_API_KEY = 'xai-test-1234567890abcdefghijklmnopqrstuvwxyz'
process.env.DEEPSEEK_API_KEY = 'sk-test-deepseek-1234567890abcdefghijklmnop'

// Disable external API calls during testing
process.env.DISABLE_EXTERNAL_APIS = 'true'

// Set timezone for consistent test results
process.env.TZ = 'UTC'
