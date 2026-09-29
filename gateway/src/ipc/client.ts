/**
 * IPC Client for communicating with Revit Add-in via Named Pipe
 */

import { spawn } from 'child_process';
import * as net from 'net';
import { v4 as uuidv4 } from 'uuid';

export interface IpcRequest {
  requestId: string;
  token: string;
  command: string;
  params: Record<string, unknown>;
}

export interface IpcResponse {
  requestId: string;
  ok: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export class IpcClient {
  private socket: net.Socket | null = null;
  private token: string = '';
  private pendingRequests: Map<string, {
    resolve: (value: IpcResponse) => void;
    reject: (reason: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private buffer: Buffer = Buffer.alloc(0);
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = net.createConnection({
          port: 8080, // Named pipe port
          host: 'localhost'
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.authenticate().then(resolve).catch(reject);
        });

        this.socket.on('data', (data) => this.handleData(data));
        this.socket.on('error', (err) => this.handleError(err));
        this.socket.on('close', () => this.handleClose());
      } catch (error) {
        reject(error);
      }
    });
  }

  private async authenticate(): Promise<void> {
    // Send authentication request
    const authResponse = await this.sendRequest('authenticate', {});
    if (!authResponse.ok) {
      throw new Error('Authentication failed');
    }
    this.token = (authResponse.result as { token: string }).token;
  }

  private handleData(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);
    
    // Process complete messages (NDJSON format)
    const lines = this.buffer.toString().split('\n');
    this.buffer = Buffer.from(lines.pop() || '');

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: IpcResponse = JSON.parse(line);
          this.handleResponse(response);
        } catch (e) {
          console.error('Failed to parse response:', e);
        }
      }
    }
  }

  private handleResponse(response: IpcResponse): void {
    const pending = this.pendingRequests.get(response.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.requestId);
      pending.resolve(response);
    }
  }

  private handleError(error: Error): void {
    console.error('IPC error:', error);
    this.isConnected = false;
    this.scheduleReconnect();
  }

  private handleClose(): void {
    console.log('IPC connection closed');
    this.isConnected = false;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(console.error);
    }, 5000);
  }

  async sendRequest(command: string, params: Record<string, unknown>): Promise<IpcResponse> {
    if (!this.isConnected) {
      throw new Error('IPC not connected');
    }

    const requestId = uuidv4();
    const request: IpcRequest = {
      requestId,
      token: this.token,
      command,
      params
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('IPC request timeout'));
      }, 30000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      this.socket?.write(JSON.stringify(request) + '\n');
    });
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.end();
    this.isConnected = false;
  }

  isConnectedToRevit(): boolean {
    return this.isConnected;
  }
}
