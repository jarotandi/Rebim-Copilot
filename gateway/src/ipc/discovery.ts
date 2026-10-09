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
 * Validate a single descriptor
 */
export function validateDescriptor(descriptor: RuntimeDescriptor): boolean {
  if (descriptor.bridgeVersion !== 1) return false;
  if (descriptor.processId <= 0) return false;
  if (!descriptor.pipeName) return false;
  if (!descriptor.token) return false;
  return true;
}

/**
 * Filter valid descriptors from a list
 */
export function filterValidDescriptors(
  descriptors: RuntimeDescriptor[],
  isAlive: (pid: number) => boolean
): RuntimeDescriptor[] {
  return descriptors.filter(d => validateDescriptor(d) && isAlive(d.processId));
}

/**
 * Resolve descriptor from a list
 */
export function resolveDescriptorFromList(
  descriptors: RuntimeDescriptor[],
  targetProcessId?: number
): RuntimeDescriptor {
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

        if (!validateDescriptor(descriptor)) continue;
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
  return resolveDescriptorFromList(descriptors, targetProcessId);
}
