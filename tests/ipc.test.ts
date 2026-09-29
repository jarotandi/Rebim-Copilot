/**
 * IPC Client Tests
 * Validates IPC communication with Revit Add-in
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IpcClient } from '../src/ipc/client.js';

describe('IpcClient', () => {
  let client: IpcClient;

  beforeEach(() => {
    client = new IpcClient();
  });

  afterEach(async () => {
    await client.disconnect();
  });

  it('should create client instance', () => {
    expect(client).toBeDefined();
  });

  it('should not be connected initially', () => {
    expect(client.isConnectedToRevit()).toBe(false);
  });

  it('should throw when sending request while disconnected', async () => {
    await expect(client.sendRequest('ping', {})).rejects.toThrow('IPC not connected');
  });

  // Note: Integration tests with actual Revit connection
  // would require a running Revit instance with the add-in loaded
});
