/**
 * OpenAI Provider for cloud AI
 * Optional provider for ReBIM Copilot
 */

import { AIProvider, ProviderCapabilities } from './router.js';

export class OpenAIProvider implements AIProvider {
  name = 'openai' as const;
  capabilities: ProviderCapabilities = {
    tools: true,
    vision: true,
    reasoning: true,
    context: 128000,
    speed: 'fast',
    memory: 'high',
    quality: 'high'
  };

  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: unknown[], tools?: unknown[]): Promise<unknown> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async *streamChat(messages: unknown[], tools?: unknown[]): AsyncGenerator<unknown> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.statusText}`);
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
          if (data === '[DONE]') return;
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
