/**
 * IPC Client Tests
 * Baseline tests only; live Revit/Named-Pipe coverage begins in RCP-02.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IpcClient } from '../gateway/src/ipc/client.js';

describe('IpcClient baseline', () => {
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
});
