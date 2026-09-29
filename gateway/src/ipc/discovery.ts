/**
 * RCP-02 Runtime Discovery
 * Discovers valid RCP-02 Revit instances via runtime descriptors
 */

import * as fs from 'fs';
import * as path from 'path';
import { RuntimeDescriptor } from './types.js';

const RUNTIME_DIR = path.join(
  process.env.LOCALAPPDATA || '',
  'ReBIM', 'Copilot', 'runtime'
);

/**
 * Get the runtime directory path
 */
export function getRuntimeDirectory(): string {
  return RUNTIME_DIR;
}

/**
 * Check if a process is running
 */
function isProcessRunning(processId: number): boolean {
  try {
    process.kill(processId, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Discover valid runtime descriptors
 */
export function discoverValidDescriptors(): RuntimeDescriptor[] {
  const valid: RuntimeDescriptor[] = [];

  try {
    if (!fs.existsSync(RUNTIME_DIR)) return valid;

    const files = fs.readdirSync(RUNTIME_DIR)
      .filter(f => f.startsWith('revit-') && f.endsWith('.json'));

    for (const file of files) {
      try {
        const filePath = path.join(RUNTIME_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const descriptor = JSON.parse(content) as RuntimeDescriptor;

        if (descriptor.bridgeVersion !== 1) continue;
        if (descriptor.processId <= 0) continue;
        if (!descriptor.pipeName) continue;
        if (!descriptor.token) continue;

        // Check if process is still running
        if (!isProcessRunning(descriptor.processId)) continue;

        valid.push(descriptor);
      } catch {
        // Ignore malformed descriptors
      }
    }
  } catch {
    // Return empty list on error
  }

  return valid;
}

/**
 * Resolve a single descriptor based on processId or fail closed
 */
export function resolveDescriptor(targetProcessId?: number): RuntimeDescriptor {
  const descriptors = discoverValidDescriptors();

  if (descriptors.length === 0) {
    throw new Error('No valid RCP-02 Revit instance found');
  }

  if (targetProcessId !== undefined) {
    const match = descriptors.find(d => d.processId === targetProcessId);
    if (!match) {
      throw new Error(`Revit instance with PID ${targetProcessId} not found`);
    }
    return match;
  }

  if (descriptors.length > 1) {
    throw new Error('Multiple RCP-02 Revit instances found. Please specify a processId.');
  }

  return descriptors[0];
}
