/**
 * AI Provider Integration
 * 
 * Handles API calls to various AI providers with fallback support.
 * All providers use OpenAI-compatible API format.
 */

import { getAIProviders, getDefaultAIProvider, getAIChatLinks } from './supabase';
import { sleep } from './utils';

// Default provider configurations (for seeding)
export const DEFAULT_PROVIDERS = [
  {
    provider_name: 'Groq',
    api_base_url: 'https://api.groq.com/openai/v1',
    model_name: 'llama-3.3-70b-versatile',
    is_free: true,
    notes: '14,400 requests/day free. Extremely fast (300+ tokens/sec).',
  },
  {
    provider_name: 'Cerebras',
    api_base_url: 'https://api.cerebras.ai/v1',
    model_name: 'llama3.1-70b',
    is_free: true,
    notes: '1M tokens/day free. Up to 2,600 tokens/sec.',
  },
  {
    provider_name: 'Google Gemini',
    api_base_url: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model_name: 'gemini-2.0-flash-lite',
    is_free: true,
    notes: '1,000 requests/day free for Flash-Lite.',
  },
  {
    provider_name: 'OpenRouter',
    api_base_url: 'https://openrouter.ai/api/v1',
    model_name: 'meta-llama/llama-3.3-70b-instruct:free',
    is_free: true,
    notes: '50 requests/day free (1,000/day with $10 deposit).',
  },
  {
    provider_name: 'Mistral',
    api_base_url: 'https://api.mistral.ai/v1',
    model_name: 'mistral-small-latest',
    is_free: true,
    notes: '1B tokens/month free.',
  },
  {
    provider_name: 'DeepSeek',
    api_base_url: 'https://api.deepseek.com/v1',
    model_name: 'deepseek-chat',
    is_free: false,
    notes: '5M free credits. ~$0.0002 per comment.',
  },
  {
    provider_name: 'OpenAI',
    api_base_url: 'https://api.openai.com/v1',
    model_name: 'gpt-4o-mini',
    is_free: false,
    notes: 'Pay as you go. High quality.',
  },
  {
    provider_name: 'Anthropic',
    api_base_url: 'https://api.anthropic.com/v1',
    model_name: 'claude-3-haiku-20240307',
    is_free: false,
    notes: 'Pay as you go. High quality.',
  },
];

/**
 * Fetch available models from OpenRouter
 */
export async function fetchOpenRouterModels(apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for free models and sort by popularity/context length
    const freeModels = data.data
      .filter(model => model.id.includes(':free'))
      .sort((a, b) => {
        // Sort by context length (higher first), then by name
        const aContext = a.context_length || 0;
        const bContext = b.context_length || 0;
        if (aContext !== bContext) {
          return bContext - aContext;
        }
        return a.name.localeCompare(b.name);
      })
      .map(model => ({
        value: model.id,
        label: `${model.name} (${model.context_length || 'Unknown'} tokens)`,
        description: model.description,
      }));

    return freeModels;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    // Return fallback models if API fails
    return [
      { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Meta Llama 3.3 70B Instruct (Free)' },
      { value: 'microsoft/wizardlm-2-8x22b:free', label: 'Microsoft WizardLM 2 8x22B (Free)' },
      { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B Instruct (Free)' },
    ];
  }
}

/**
 * Error types for AI calls
 */
export class AIError extends Error {
  constructor(message, code, provider) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.provider = provider;
  }
}

/**
 * Make a completion request to an AI provider
 */
async function makeCompletionRequest(provider, messages, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 1024,
    timeout = 30000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Handle Anthropic's different API format
    const isAnthropic = provider.api_base_url.includes('anthropic.com');
    
    let url = `${provider.api_base_url}/chat/completions`;
    let headers = {
      'Content-Type': 'application/json',
    };
    let body;

    if (isAnthropic) {
      url = `${provider.api_base_url}/messages`;
      headers['x-api-key'] = provider.api_key_encrypted; // Will be decrypted server-side
      headers['anthropic-version'] = '2023-06-01';
      
      // Convert messages format for Anthropic
      const systemMessage = messages.find(m => m.role === 'system');
      const otherMessages = messages.filter(m => m.role !== 'system');
      
      body = JSON.stringify({
        model: provider.model_name,
        max_tokens: maxTokens,
        system: systemMessage?.content || '',
        messages: otherMessages,
      });
    } else {
      // OpenAI-compatible format
      headers['Authorization'] = `Bearer ${provider.api_key_encrypted}`;
      
      // OpenRouter requires additional headers
      if (provider.api_base_url.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Maximus Engagimus';
      }

      body = JSON.stringify({
        model: provider.model_name,
        messages,
        temperature,
        max_tokens: maxTokens,
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      
      // Check for rate limit
      if (response.status === 429) {
        throw new AIError(
          `Rate limit exceeded: ${errorMessage}`,
          'RATE_LIMIT',
          provider.provider_name
        );
      }
      
      // Check for auth error
      if (response.status === 401 || response.status === 403) {
        throw new AIError(
          `Authentication failed: ${errorMessage}`,
          'AUTH_ERROR',
          provider.provider_name
        );
      }

      throw new AIError(
        `API error: ${errorMessage}`,
        'API_ERROR',
        provider.provider_name
      );
    }

    const data = await response.json();

    // Extract content based on provider format
    let content;
    if (isAnthropic) {
      content = data.content?.[0]?.text || '';
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    return {
      content,
      provider: provider.provider_name,
      model: provider.model_name,
      usage: data.usage,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new AIError(
        'Request timed out',
        'TIMEOUT',
        provider.provider_name
      );
    }

    if (error instanceof AIError) {
      throw error;
    }

    throw new AIError(
      error.message || 'Unknown error',
      'UNKNOWN',
      provider.provider_name
    );
  }
}

/**
 * Generate a completion with automatic fallback
 */
export async function generateCompletion(messages, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    ...completionOptions
  } = options;

  // Get all active providers
  const providers = await getAIProviders();
  const activeProviders = providers
    .filter(p => p.is_active && p.api_key_encrypted)
    .sort((a, b) => {
      // Default provider first, then by fallback order
      if (a.is_default) return -1;
      if (b.is_default) return 1;
      return a.fallback_order - b.fallback_order;
    });

  if (activeProviders.length === 0) {
    throw new AIError(
      'No active AI providers configured. Please add an API key in Settings.',
      'NO_PROVIDERS',
      null
    );
  }

  const errors = [];

  // Try each provider in order
  for (const provider of activeProviders) {
    let lastError;

    // Retry logic for each provider
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await makeCompletionRequest(
          provider,
          messages,
          completionOptions
        );
        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on auth errors
        if (error.code === 'AUTH_ERROR') {
          break;
        }

        // Wait before retrying (with exponential backoff)
        if (attempt < maxRetries - 1) {
          await sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    errors.push(lastError);

    // If rate limited, try next provider immediately
    // Otherwise, wait a bit before trying next provider
    if (lastError?.code !== 'RATE_LIMIT') {
      await sleep(500);
    }
  }

  // All providers failed
  const errorMessages = errors.map(e => `${e.provider}: ${e.message}`).join('; ');
  throw new AIError(
    `All providers failed: ${errorMessages}`,
    'ALL_FAILED',
    null
  );
}

/**
 * Parse AI response to extract comment options
 */
export function parseCommentOptions(content, maxLength = null) {
  const options = [];
  
  // Try to parse as JSON first
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => {
          const text = item.text || item.comment || item.content || '';
          const truncatedText = maxLength && text.length > maxLength 
            ? text.slice(0, maxLength).trim() 
            : text;
          return {
            index,
            style: item.style || 'conversational',
            text: truncatedText,
            charCount: truncatedText.length,
          };
        });
      }
    }
  } catch {
    // Fall through to regex parsing
  }

  // Parse numbered format: "1. [Style] Comment text"
  const numberedPattern = /(\d+)\.\s*\[?(\w+(?:-\w+)?)\]?[:\s]+(.+?)(?=\n\d+\.|$)/gs;
  let match;
  while ((match = numberedPattern.exec(content)) !== null) {
    const text = match[3].trim();
    const truncatedText = maxLength && text.length > maxLength 
      ? text.slice(0, maxLength).trim() 
      : text;
    options.push({
      index: options.length,
      style: match[2].toLowerCase().replace(/\s+/g, '-'),
      text: truncatedText,
      charCount: truncatedText.length,
    });
  }

  // If no numbered format found, try splitting by double newlines
  if (options.length === 0) {
    const parts = content.split(/\n\n+/).filter(p => p.trim());
    parts.forEach((part, index) => {
      // Try to extract style from the beginning
      const styleMatch = part.match(/^\[?(\w+(?:-\w+)?)\]?[:\s]+(.+)/s);
      if (styleMatch) {
        const text = styleMatch[2].trim();
        const truncatedText = maxLength && text.length > maxLength 
          ? text.slice(0, maxLength).trim() 
          : text;
        options.push({
          index,
          style: styleMatch[1].toLowerCase().replace(/\s+/g, '-'),
          text: truncatedText,
          charCount: truncatedText.length,
        });
      } else {
        const text = part.trim();
        const truncatedText = maxLength && text.length > maxLength 
          ? text.slice(0, maxLength).trim() 
          : text;
        options.push({
          index,
          style: 'conversational',
          text: truncatedText,
          charCount: truncatedText.length,
        });
      }
    });
  }

  return options;
}

/**
 * Get AI chat links for "No API" mode
 */
export async function getChatLinks() {
  return getAIChatLinks();
}

/**
 * Build a prompt and copy to clipboard for manual AI use
 */
export function buildPromptForClipboard(systemPrompt, userPrompt) {
  return `${systemPrompt}\n\n---\n\n${userPrompt}`;
}

/**
 * Check if any AI providers are configured
 */
export async function hasConfiguredProviders() {
  try {
    const provider = await getDefaultAIProvider();
    return !!provider;
  } catch {
    return false;
  }
}

/**
 * Test an AI provider connection
 */
export async function testProvider(provider) {
  const testMessages = [
    { role: 'user', content: 'Say "Connection successful" and nothing else.' }
  ];

  try {
    const result = await makeCompletionRequest(provider, testMessages, {
      maxTokens: 20,
      timeout: 10000,
    });
    
    return {
      success: true,
      message: 'Connection successful',
      response: result.content,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      code: error.code,
    };
  }
}

export default {
  generateCompletion,
  parseCommentOptions,
  getChatLinks,
  buildPromptForClipboard,
  hasConfiguredProviders,
  testProvider,
  DEFAULT_PROVIDERS,
  AIError,
};
