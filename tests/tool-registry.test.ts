/**
 * Tool Registry Tests
 * Validates tool registration and mode-based filtering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../src/tools/registry.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should load default tools', () => {
    const tools = registry.getTools();
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should have get_selection tool', () => {
    const tool = registry.getTool('get_selection');
    expect(tool).toBeDefined();
    expect(tool?.risk).toBe('READ');
  });

  it('should have set_parameter tool', () => {
    const tool = registry.getTool('set_parameter');
    expect(tool).toBeDefined();
    expect(tool?.risk).toBe('SAFE_WRITE');
  });

  it('should filter tools by mode', () => {
    registry.setMode('Ask');
    const askTools = registry.getAllowedTools();
    
    // Ask mode should not have set_parameter
    const hasSetParam = askTools.some(t => t.name === 'set_parameter');
    expect(hasSetParam).toBe(false);
  });

  it('should allow set_parameter in Edit mode', () => {
    registry.setMode('Edit');
    const editTools = registry.getAllowedTools();
    
    const hasSetParam = editTools.some(t => t.name === 'set_parameter');
    expect(hasSetParam).toBe(true);
  });

  it('should check if tool is allowed', () => {
    registry.setMode('Ask');
    expect(registry.isToolAllowed('get_selection')).toBe(true);
    expect(registry.isToolAllowed('set_parameter')).toBe(false);
  });

  it('should return current mode', () => {
    registry.setMode('Analyze');
    expect(registry.getCurrentMode()).toBe('Analyze');
  });

  it('should have correct modes for each tool', () => {
    const tools = registry.getTools();
    
    for (const tool of tools) {
      expect(tool.modes).toContain('Ask');
      expect(tool.modes.length).toBeGreaterThan(0);
    }
  });

  it('should have find_elements only in Analyze+ modes', () => {
    const tool = registry.getTool('find_elements');
    expect(tool).toBeDefined();
    expect(tool?.modes).not.toContain('Ask');
    expect(tool?.modes).toContain('Analyze');
  });
});
