/**
 * RCP-02 IPC Client for communicating with Revit Add-in via Named Pipe
 * Uses Windows Named Pipe only - NO TCP fallback
 * NO automatic reconnect - explicit connect/disconnect only
 */

import * as net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { BridgeRequest, BridgeResponse, BridgeOperations, BridgeErrors } from './types.js';
import { encodeFrame, tryDecodeFrame, MAX_FRAME_BYTES } from './framing.js';
import { resolveDescriptor, discoverValidDescriptors } from './discovery.js';

export interface IpcClientOptions {
  processId?: number;
  connectTimeoutMs?: number;
  requestTimeoutMs?: number;
}

export interface RequestOptions {
  timeoutMs?: number;
}

export class IpcClient {
  private socket: net.Socket | null = null;
  private token: string = '';
  private pendingRequests: Map<string, {
    resolve: (value: BridgeResponse) => void;
    reject: (reason: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private buffer: Buffer = Buffer.alloc(0);
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private options: {
    processId?: number;
    connectTimeoutMs: number;
    requestTimeoutMs: number;
  };
  private pipeName: string = '';

  constructor(options: IpcClientOptions = {}) {
    this.options = {
      processId: options.processId ?? undefined,
      connectTimeoutMs: options.connectTimeoutMs ?? 3000,
      requestTimeoutMs: options.requestTimeoutMs ?? 5000,
    };
  }

  /**
   * Connect to the Revit add-in via Named Pipe
   * Resolves ONLY after: socket connected + authentication ok + isAuthenticated === true
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Resolve descriptor inside promise executor
      let descriptor;
      try {
        descriptor = resolveDescriptor(this.options.processId);
      } catch (error) {
        reject(error);
        return;
      }
      this.pipeName = descriptor.pipeName;
      this.token = descriptor.token;

      const connectTimeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error('Connection timeout'));
      }, this.options.connectTimeoutMs);

      let connectSettled = false;

      const resolveOnce = () => {
        if (connectSettled) return;
        connectSettled = true;
        clearTimeout(connectTimeout);
        resolve(undefined);
      };

      const rejectOnce = (error: Error) => {
        if (connectSettled) return;
        connectSettled = true;
        clearTimeout(connectTimeout);
        reject(error);
      };

      try {
        // Connect to Windows Named Pipe
        this.socket = net.createConnection(`\\\\.\\pipe\\${this.pipeName}`);

        this.socket.on('connect', () => {
          this.isConnected = true;
          // DO NOT resolve here - wait for authentication
          this.authenticate()
            .then(() => {
              if (this.isAuthenticated) {
                resolveOnce();
              } else {
                rejectOnce(new Error('Authentication succeeded but isAuthenticated is false'));
              }
            })
            .catch((err) => {
              // Authentication failed - cleanup
              this.isConnected = false;
              this.isAuthenticated = false;
              this.socket?.destroy();
              this.socket = null;
              rejectOnce(err);
            });
        });

        this.socket.on('data', (data) => this.handleData(data));
        this.socket.on('error', (err) => {
          this.handleError(err);
          rejectOnce(err);
        });
        this.socket.on('close', () => this.handleClose());
      } catch (error) {
        clearTimeout(connectTimeout);
        reject(error);
      }
    });
  }

  /**
   * Authenticate with the bridge
   */
  private async authenticate(): Promise<void> {
    const response = await this.sendRequest(BridgeOperations.Authenticate, { token: this.token });
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.error?.message}`);
    }
    this.isAuthenticated = true;
  }

  /**
   * Handle incoming data
   */
  private handleData(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);

    // Process complete frames
    while (true) {
      try {
        const result = tryDecodeFrame(this.buffer);
        if (!result) break;

        this.buffer = result.remaining;
        const response: BridgeResponse = JSON.parse(result.data.toString('utf-8'));
        this.handleResponse(response);
      } catch (e) {
        console.error('Failed to decode frame:', e);
        break;
      }
    }
  }

  /**
   * Handle response
   */
  private handleResponse(response: BridgeResponse): void {
    const pending = this.pendingRequests.get(response.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.requestId);
      pending.resolve(response);
    }
  }

  /**
   * Handle error - reject all pending requests
   */
  private handleError(error: Error): void {
    console.error('IPC error:', error);
    this.rejectAllPending();
    this.isConnected = false;
    this.isAuthenticated = false;
    this.socket = null;
  }

  /**
   * Handle close - reject all pending requests
   */
  private handleClose(): void {
    this.rejectAllPending();
    this.isConnected = false;
    this.isAuthenticated = false;
    this.socket = null;
  }

  /**
   * Reject all pending requests
   */
  private rejectAllPending(): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
  }

  /**
   * Send a bridge control request (public API)
   * Only allowlisted operations are permitted
   * Supports per-request timeout override for testing
   */
  async sendRequest(operation: string, params: Record<string, unknown>, timeoutMs?: number): Promise<BridgeResponse> {
    // Allowlist check
    const allowedOperations: string[] = [BridgeOperations.Ping, BridgeOperations.ContextProbe, BridgeOperations.Authenticate];
    if (!allowedOperations.includes(operation)) {
      throw new Error('Semantic BIM commands are unavailable until RCP-03+.');
    }

    if (!this.isConnected) {
      throw new Error('IPC not connected');
    }

    const requestId = uuidv4();
    const request: BridgeRequest = {
      bridgeVersion: 1,
      requestId,
      operation,
      ...params,
    };

    const effectiveTimeout = timeoutMs ?? this.options.requestTimeoutMs;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('IPC request timeout'));
      }, effectiveTimeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      const frame = encodeFrame(Buffer.from(JSON.stringify(request), 'utf-8'));
      this.socket?.write(frame);
    });
  }

  /**
   * Ping the bridge
   */
  async ping(): Promise<BridgeResponse> {
    return this.sendRequest(BridgeOperations.Ping, {});
  }

  /**
   * Context probe - returns bounded host diagnostics
   * Supports per-request timeout override for testing
   */
  async contextProbe(options?: RequestOptions): Promise<BridgeResponse> {
    return this.sendRequest(BridgeOperations.ContextProbe, {}, options?.timeoutMs);
  }

  /**
   * Disconnect from the bridge (NO automatic reconnect)
   * Waits for the socket to actually close before resolving.
   */
  async disconnect(): Promise<void> {
    const socket = this.socket;

    if (!socket) {
      this.isConnected = false;
      this.isAuthenticated = false;
      this.buffer = Buffer.alloc(0);
      return;
    }

    await new Promise<void>((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve();
      };

      const timeout = setTimeout(() => {
        socket.destroy();
        finish();
      }, 1000);

      socket.once('close', finish);
      socket.end();
    });

    if (this.socket === socket) {
      this.socket = null;
    }

    this.isConnected = false;
    this.isAuthenticated = false;
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Check if connected to Revit
   */
  isConnectedToRevit(): boolean {
    return this.isConnected && this.isAuthenticated;
  }

  /**
   * Get discovered descriptors (for diagnostics)
   */
  getDiscoveredDescriptors() {
    return discoverValidDescriptors();
  }

  /**
   * Get pending request count for tests
   */
  getPendingRequestCountForTests(): number {
    return this.pendingRequests.size;
  }

  /**
   * Pause inbound data processing (for deterministic timeout testing)
   * Pauses the socket so responses are buffered but not processed
   */
  pauseInboundForTests(): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('IPC not connected');
    }
    this.socket.pause();
  }

  /**
   * Resume inbound data processing after pause
   */
  resumeInboundForTests(): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('IPC not connected');
    }
    this.socket.resume();
  }

  /**
   * Compatibility method for MCP/agent - NOT for RCP-02 use
   * Semantic BIM commands are unavailable until RCP-03+
   */
  async sendBridgeRequest(_operation: string, _params: Record<string, unknown>): Promise<never> {
    throw new Error('Semantic BIM commands are unavailable until RCP-03+.');
  }
}
