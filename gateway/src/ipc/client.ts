/**
 * RCP-02 IPC Client for communicating with Revit Add-in via Named Pipe
 * Uses Windows Named Pipe only - NO TCP fallback
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

export class IpcClient {
  private socket: net.Socket | null = null;
  private token: string = '';
  private pendingRequests: Map<string, {
    resolve: (value: BridgeResponse) => void;
    reject: (reason: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private buffer: Buffer = Buffer.alloc(0);
  private reconnectTimer: NodeJS.Timeout | null = null;
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
   */
  async connect(): Promise<void> {
    // Resolve descriptor
    const descriptor = resolveDescriptor(this.options.processId);
    this.pipeName = descriptor.pipeName;
    this.token = descriptor.token;

    return new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.options.connectTimeoutMs);

      try {
        // Connect to Windows Named Pipe
        this.socket = net.createConnection(`\\\\.\\pipe\\${this.pipeName}`);

        this.socket.on('connect', () => {
          clearTimeout(connectTimeout);
          this.isConnected = true;
          this.authenticate().then(resolve).catch(reject);
        });

        this.socket.on('data', (data) => this.handleData(data));
        this.socket.on('error', (err) => this.handleError(err));
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
   * Handle error
   */
  private handleError(error: Error): void {
    console.error('IPC error:', error);
    this.isConnected = false;
    this.isAuthenticated = false;
    this.scheduleReconnect();
  }

  /**
   * Handle close
   */
  private handleClose(): void {
    this.isConnected = false;
    this.isAuthenticated = false;
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnect
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(console.error);
    }, 5000);
  }

  /**
   * Send a request
   */
  private async sendRequest(operation: string, params: Record<string, unknown>): Promise<BridgeResponse> {
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

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('IPC request timeout'));
      }, this.options.requestTimeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      const frame = encodeFrame(Buffer.from(JSON.stringify(request), 'utf-8'));
      this.socket?.write(frame);
    });
  }

  /**
   * Send a bridge control request (public API)
   */
  async sendBridgeRequest(operation: string, params: Record<string, unknown>): Promise<BridgeResponse> {
    return this.sendRequest(operation, params);
  }

  /**
   * Ping the bridge
   */
  async ping(): Promise<BridgeResponse> {
    return this.sendRequest(BridgeOperations.Ping, {});
  }

  /**
   * Context probe - returns bounded host diagnostics
   */
  async contextProbe(): Promise<BridgeResponse> {
    return this.sendRequest(BridgeOperations.ContextProbe, {});
  }

  /**
   * Disconnect from the bridge
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.end();
    this.isConnected = false;
    this.isAuthenticated = false;
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
}
