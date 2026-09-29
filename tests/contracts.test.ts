/**
 * Contract Tests for ReBIM Copilot
 * Validates JSON schemas and contract compliance
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contractsPath = join(__dirname, '../contracts');

describe('Command Schema', () => {
  const schema = JSON.parse(readFileSync(join(contractsPath, 'command.schema.json'), 'utf-8'));

  it('should have required fields', () => {
    expect(schema.required).toContain('requestId');
    expect(schema.required).toContain('host');
    expect(schema.required).toContain('command');
    expect(schema.required).toContain('arguments');
  });

  it('should have correct host enum', () => {
    expect(schema.properties.host.enum).toEqual(['revit']);
  });

  it('should reject undeclared top-level properties', () => {
    expect(schema.additionalProperties).toBe(false);
  });
});

describe('Result Schema', () => {
  const schema = JSON.parse(readFileSync(join(contractsPath, 'result.schema.json'), 'utf-8'));

  it('should have required fields', () => {
    expect(schema.required).toContain('requestId');
    expect(schema.required).toContain('ok');
  });

  it('should have canonical error codes', () => {
    const errorCodes = schema.properties.error.properties.code.enum;
    expect(errorCodes).toContain('REBIM_VALIDATION_ERROR');
    expect(errorCodes).toContain('REBIM_STALE_CONTEXT');
    expect(errorCodes).toContain('REBIM_IPC_UNAVAILABLE');
  });
});

describe('Context Schema', () => {
  const schema = JSON.parse(readFileSync(join(contractsPath, 'context.schema.json'), 'utf-8'));

  it('should have required fields', () => {
    expect(schema.required).toContain('host');
    expect(schema.required).toContain('document');
    expect(schema.required).toContain('view');
    expect(schema.required).toContain('selection');
    expect(schema.required).toContain('revision');
  });

  it('should have selection as array', () => {
    expect(schema.properties.selection.type).toBe('array');
  });
});

describe('Tool Registry', () => {
  const registry = JSON.parse(readFileSync(join(contractsPath, 'tool-registry.json'), 'utf-8'));

  it('should have version', () => {
    expect(registry.version).toBe('0.1.0');
  });

  it('should have tools array', () => {
    expect(Array.isArray(registry.tools)).toBe(true);
    expect(registry.tools.length).toBeGreaterThan(0);
  });

  it('should have required tool fields', () => {
    for (const tool of registry.tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('risk');
      expect(tool).toHaveProperty('modes');
      expect(tool).toHaveProperty('description');
    }
  });

  it('should have correct risk levels', () => {
    const validRisks = ['READ', 'UI', 'SAFE_WRITE', 'WRITE', 'DESTRUCTIVE'];
    for (const tool of registry.tools) {
      expect(validRisks).toContain(tool.risk);
    }
  });

  it('should have set_parameter as SAFE_WRITE', () => {
    const setParam = registry.tools.find((t: { name: string }) => t.name === 'set_parameter');
    expect(setParam).toBeDefined();
    expect(setParam.risk).toBe('SAFE_WRITE');
  });
});

describe('Error Codes', () => {
  const errorCodes = JSON.parse(readFileSync(join(contractsPath, 'error-codes.json'), 'utf-8'));

  it('should have version', () => {
    expect(errorCodes.version).toBe('0.1.0');
  });

  it('should have errors array', () => {
    expect(Array.isArray(errorCodes.errors)).toBe(true);
    expect(errorCodes.errors.length).toBeGreaterThan(0);
  });

  it('should have required error fields', () => {
    for (const error of errorCodes.errors) {
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('action');
    }
  });
});
