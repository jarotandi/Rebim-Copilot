/**
 * Provider Router for ReBIM Copilot
 * Routes AI requests to appropriate provider (Ollama, OpenAI, Anthropic)
 */

import { OllamaProvider } from './ollama.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';

export type ProviderType = 'ollama' | 'openai' | 'anthropic';

export interface ProviderCapabilities {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
  context: number;
  speed: 'fast' | 'medium' | 'slow';
  memory: 'low' | 'medium' | 'high';
  quality: 'low' | 'medium' | 'high';
}

export interface AIProvider {
  name: ProviderType;
  capabilities: ProviderCapabilities;
  isAvailable(): Promise<boolean>;
  chat(messages: unknown[], tools?: unknown[]): Promise<unknown>;
  streamChat(messages: unknown[], tools?: unknown[]): AsyncGenerator<unknown>;
}

export interface RouterConfig {
  defaultProvider: ProviderType;
  privacyMode: 'local-only' | 'ask-before-cloud' | 'cloud-allowed';
}

export class ProviderRouter {
  private providers: Map<ProviderType, AIProvider> = new Map();
  private config: RouterConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private providerHealth: Map<ProviderType, boolean> = new Map();

  constructor(config: RouterConfig) {
    this.config = config;
    this.providers.set('ollama', new OllamaProvider());
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
  }

  startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [name, provider] of this.providers) {
        try {
          const available = await provider.isAvailable();
          this.providerHealth.set(name, available);
        } catch {
          this.providerHealth.set(name, false);
        }
      }
    }, 30000);
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async route(
    messages: unknown[],
    options: {
      requireTools?: boolean;
      requireVision?: boolean;
      requireReasoning?: boolean;
      preferLocal?: boolean;
    } = {}
  ): Promise<AIProvider> {
    // Check privacy mode
    if (this.config.privacyMode === 'local-only') {
      const ollama = this.providers.get('ollama')!;
      if (await ollama.isAvailable()) {
        return ollama;
      }
      throw new Error('Local provider unavailable and privacy mode is local-only');
    }

    // Try local first if preferred
    if (options.preferLocal !== false) {
      const ollama = this.providers.get('ollama')!;
      if (await ollama.isAvailable()) {
        const caps = ollama.capabilities;
        if ((!options.requireTools || caps.tools) &&
            (!options.requireVision || caps.vision) &&
            (!options.requireReasoning || caps.reasoning)) {
          return ollama;
        }
      }
    }

    // Fall back to cloud providers
    if (this.config.privacyMode === 'cloud-allowed') {
      for (const name of ['openai', 'anthropic'] as ProviderType[]) {
        const provider = this.providers.get(name)!;
        if (await provider.isAvailable()) {
          return provider;
        }
      }
    }

    throw new Error('No suitable provider available');
  }

  getProviderStatus(): Record<ProviderType, boolean> {
    return Object.fromEntries(this.providerHealth) as Record<ProviderType, boolean>;
  }
}
