/**
 * Ollama Provider for local AI
 * Default provider for ReBIM Copilot local-first architecture
 */

import { AIProvider, ProviderCapabilities } from './router.js';

export class OllamaProvider implements AIProvider {
  name = 'ollama' as const;
  capabilities: ProviderCapabilities = {
    tools: true,
    vision: false,
    reasoning: true,
    context: 8192,
    speed: 'medium',
    memory: 'medium',
    quality: 'medium'
  };

  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.1') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: unknown[], tools?: unknown[]): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async *streamChat(messages: unknown[], tools?: unknown[]): AsyncGenerator<unknown> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
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
        if (line.trim()) {
          try {
            yield JSON.parse(line);
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json() as { models: Array<{ name: string }> };
      return data.models.map(m => m.name);
    } catch {
      return [];
    }
  }
}
