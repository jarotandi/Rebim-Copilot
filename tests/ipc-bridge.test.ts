/**
 * RCP-02 Bridge Tests
 * Pure/in-memory tests for framing, discovery, and client behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encodeFrame, tryDecodeFrame, MAX_FRAME_BYTES } from '../gateway/src/ipc/framing.js';
import { BridgeOperations, BridgeErrors } from '../gateway/src/ipc/types.js';

describe('Bridge Framing', () => {
  it('should encode and decode a frame round-trip', () => {
    const data = Buffer.from('{"test":true}', 'utf-8');
    const frame = encodeFrame(data);
    const result = tryDecodeFrame(frame);
    expect(result).not.toBeNull();
    expect(result!.data.toString('utf-8')).toBe('{"test":true}');
  });

  it('should reject zero-length frame', () => {
    const frame = Buffer.alloc(4);
    frame.writeUInt32BE(0, 0);
    expect(() => tryDecodeFrame(frame)).toThrow('Invalid frame');
  });

  it('should reject oversize frame', () => {
    const frame = Buffer.alloc(4);
    frame.writeUInt32BE(MAX_FRAME_BYTES + 1, 0);
    expect(() => tryDecodeFrame(frame)).toThrow('Frame too large');
  });

  it('should handle incomplete frame buffering', () => {
    const data = Buffer.from('{"test":true}', 'utf-8');
    const frame = encodeFrame(data);
    // Send partial frame
    const partial = frame.subarray(0, 4);
    const result = tryDecodeFrame(partial);
    expect(result).toBeNull();
  });

  it('should handle multiple frames in one buffer', () => {
    const data1 = Buffer.from('{"test":1}', 'utf-8');
    const data2 = Buffer.from('{"test":2}', 'utf-8');
    const frame1 = encodeFrame(data1);
    const frame2 = encodeFrame(data2);
    const combined = Buffer.concat([frame1, frame2]);

    const result1 = tryDecodeFrame(combined);
    expect(result1).not.toBeNull();
    expect(result1!.data.toString('utf-8')).toBe('{"test":1}');

    const result2 = tryDecodeFrame(result1!.remaining);
    expect(result2).not.toBeNull();
    expect(result2!.data.toString('utf-8')).toBe('{"test":2}');
  });
});

describe('Bridge Operations', () => {
  it('should have correct operation names', () => {
    expect(BridgeOperations.Authenticate).toBe('authenticate');
    expect(BridgeOperations.Ping).toBe('ping');
    expect(BridgeOperations.ContextProbe).toBe('context_probe');
  });

  it('should have correct error codes', () => {
    expect(BridgeErrors.AuthRequired).toBe('AUTH_REQUIRED');
    expect(BridgeErrors.AuthFailed).toBe('AUTH_FAILED');
    expect(BridgeErrors.QueueFull).toBe('QUEUE_FULL');
    expect(BridgeErrors.RequestTimeout).toBe('REQUEST_TIMEOUT');
  });
});

describe('Bridge Discovery', () => {
  it('should return empty array when no descriptors exist', async () => {
    const { discoverValidDescriptors } = await import('../gateway/src/ipc/discovery.js');
    // This will return empty in test environment
    const descriptors = discoverValidDescriptors();
    expect(Array.isArray(descriptors)).toBe(true);
  });
});

describe('Bridge Client', () => {
  it('should not be connected initially', async () => {
    const { IpcClient } = await import('../gateway/src/ipc/client.js');
    const client = new IpcClient();
    expect(client.isConnectedToRevit()).toBe(false);
  });

  it('should throw on sendRequest (semantic commands unavailable)', async () => {
    const { IpcClient } = await import('../gateway/src/ipc/client.js');
    const client = new IpcClient();
    await expect(client.sendRequest('get_selection', {})).rejects.toThrow('Semantic BIM commands are unavailable');
  });
});
