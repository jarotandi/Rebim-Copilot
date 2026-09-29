/**
 * Anthropic Provider for cloud AI
 * Optional provider for ReBIM Copilot
 */

import { AIProvider, ProviderCapabilities } from './router.js';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic' as const;
  capabilities: ProviderCapabilities = {
    tools: true,
    vision: true,
    reasoning: true,
    context: 200000,
    speed: 'medium',
    memory: 'high',
    quality: 'high'
  };

  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: unknown[], tools?: unknown[]): Promise<unknown> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages,
        tools
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async *streamChat(messages: unknown[], tools?: unknown[]): AsyncGenerator<unknown> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages,
        tools,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            yield JSON.parse(data);
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}
