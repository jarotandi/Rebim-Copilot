import { describe, it, expect } from 'vitest';
import Ajv from 'ajv/dist/ajv.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ToolRegistry } from '../gateway/src/tools/registry.js';
import { REBIM_PROTOCOL_VERSION } from '../gateway/src/contracts/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contractsPath = join(__dirname, '../contracts');

function json(name: string): any {
  return JSON.parse(readFileSync(join(contractsPath, name), 'utf-8'));
}

const ajv = new Ajv({ allErrors: true, strict: false });

describe('RCP-00 manifest/version', () => {
  const manifest = json('manifest.json');

  it('pins protocol and contract versions', () => {
    expect(manifest.protocolVersion).toBe('0.1.0');
    expect(manifest.contractVersion).toBe('0.1.0');
    expect(REBIM_PROTOCOL_VERSION).toBe(manifest.protocolVersion);
    expect(manifest.hostTargets).toEqual(['revit']);
  });

  it('declares every canonical contract file', () => {
    for (const file of manifest.files) {
      expect(() => readFileSync(join(contractsPath, file), 'utf-8')).not.toThrow();
    }
  });
});

describe('canonical schemas and fixtures', () => {
  const validateCommand = ajv.compile(json('command.schema.json'));
  const validateResult = ajv.compile(json('result.schema.json'));
  const validateContext = ajv.compile(json('context.schema.json'));

  it('accepts canonical get_selection command fixture', () => {
    expect(validateCommand(json('fixtures/command.get-selection.json'))).toBe(true);
  });

  it('accepts canonical success result fixture', () => {
    expect(validateResult(json('fixtures/result.get-selection.json'))).toBe(true);
  });

  it('accepts canonical error result fixture', () => {
    expect(validateResult(json('fixtures/result.error.json'))).toBe(true);
  });

  it('accepts canonical bounded context fixture', () => {
    expect(validateContext(json('fixtures/context.selection.json'))).toBe(true);
  });

  it('rejects success results that also contain error', () => {
    const invalid = {
      ...json('fixtures/result.get-selection.json'),
      error: { code: 'REBIM_EXECUTION_FAILED', message: 'invalid coexistence' }
    };
    expect(validateResult(invalid)).toBe(false);
  });

  it('rejects error results that also contain result', () => {
    const invalid = {
      ...json('fixtures/result.error.json'),
      result: {}
    };
    expect(validateResult(invalid)).toBe(false);
  });

  it('rejects unknown command envelope fields', () => {
    const invalid = {
      ...json('fixtures/command.get-selection.json'),
      hiddenMutation: true
    };
    expect(validateCommand(invalid)).toBe(false);
  });
});

describe('tool registry contract', () => {
  const registryDocument = json('tool-registry.json');
  const validateRegistry = ajv.compile(json('tool-registry.schema.json'));

  it('validates registry document', () => {
    expect(validateRegistry(registryDocument)).toBe(true);
  });

  it('uses unique tool names', () => {
    const names = registryDocument.tools.map((tool: any) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses valid JSON Schema for every tool input', () => {
    for (const tool of registryDocument.tools) {
      expect(() => ajv.compile(tool.parameters)).not.toThrow();
    }
  });

  it('requires approval for every model mutation', () => {
    for (const tool of registryDocument.tools) {
      if (tool.mutatesModel) {
        expect(tool.requiresApproval).toBe(true);
        expect(['SAFE_WRITE', 'WRITE', 'DESTRUCTIVE']).toContain(tool.risk);
      }
    }
  });

  it('keeps READ/UI tools non-mutating', () => {
    for (const tool of registryDocument.tools) {
      if (tool.risk === 'READ' || tool.risk === 'UI') {
        expect(tool.mutatesModel).toBe(false);
        expect(tool.requiresApproval).toBe(false);
      }
    }
  });

  it('keeps set_parameter out of Ask and Analyze', () => {
    const tool = registryDocument.tools.find((item: any) => item.name === 'set_parameter');
    expect(tool.risk).toBe('SAFE_WRITE');
    expect(tool.mutatesModel).toBe(true);
    expect(tool.requiresApproval).toBe(true);
    expect(tool.modes).toEqual(['Edit', 'Automate']);
  });

  it('TypeScript ToolRegistry loads the canonical JSON source', () => {
    const registry = new ToolRegistry();
    expect(registry.getTools().map(t => t.name)).toEqual(
      registryDocument.tools.map((t: any) => t.name)
    );
  });

  it('progressively discloses tools by mode', () => {
    const registry = new ToolRegistry();
    registry.setMode('Ask');
    expect(registry.getAllowedTools().some(t => t.name === 'set_parameter')).toBe(false);
    registry.setMode('Edit');
    expect(registry.getAllowedTools().some(t => t.name === 'set_parameter')).toBe(true);
  });
});

describe('error catalog consistency', () => {
  const catalog = json('error-codes.json');
  const resultSchema = json('result.schema.json');
  const validateCatalog = ajv.compile(json('error-codes.schema.json'));

  it('validates error catalog', () => {
    expect(validateCatalog(catalog)).toBe(true);
  });

  it('uses unique error codes', () => {
    const codes = catalog.errors.map((error: any) => error.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('matches result-schema error enum exactly', () => {
    const catalogCodes = catalog.errors.map((error: any) => error.code).sort();
    const schemaCodes = [...resultSchema.properties.error.properties.code.enum].sort();
    expect(schemaCodes).toEqual(catalogCodes);
  });
});
