/**
 * Tool Registry for ReBIM Copilot.
 *
 * RCP-00 makes contracts/tool-registry.json the canonical source.
 * Do not duplicate tool definitions in TypeScript.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ToolDefinition, ToolMode } from '../contracts/types.js';

interface ToolRegistryDocument {
  protocolVersion: string;
  version: string;
  tools: ToolDefinition[];
}

function loadCanonicalRegistry(): ToolRegistryDocument {
  const path = fileURLToPath(
    new URL('../../../contracts/tool-registry.json', import.meta.url)
  );
  return JSON.parse(readFileSync(path, 'utf-8')) as ToolRegistryDocument;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private currentMode: ToolMode = 'Ask';
  private allowedTools: Set<string> = new Set();

  constructor() {
    const registry = loadCanonicalRegistry();

    for (const tool of registry.tools) {
      if (this.tools.has(tool.name)) {
        throw new Error(`Duplicate canonical tool: ${tool.name}`);
      }
      this.tools.set(tool.name, tool);
    }

    this.setMode('Ask');
  }

  setMode(mode: ToolMode): void {
    this.currentMode = mode;
    this.allowedTools.clear();

    for (const [name, tool] of this.tools) {
      if (tool.modes.includes(mode)) {
        this.allowedTools.add(name);
      }
    }
  }

  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  isToolAllowed(name: string): boolean {
    return this.allowedTools.has(name);
  }

  getAllowedTools(): ToolDefinition[] {
    return Array.from(this.allowedTools).map(name => this.tools.get(name)!);
  }

  getCurrentMode(): ToolMode {
    return this.currentMode;
  }
}
