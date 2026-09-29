/**
 * ReBIM Copilot AI Gateway
 * Main entry point for the AI Gateway server
 * Handles MCP server, provider routing, and IPC communication
 */

import { McpServer } from './mcp/server.js';
import { ProviderRouter } from './providers/router.js';
import { IpcClient } from './ipc/client.js';
import { AuditLogger } from './audit/logger.js';
import { ToolRegistry } from './tools/registry.js';

export interface GatewayConfig {
  port?: number;
  host?: string;
  defaultProvider?: 'ollama' | 'openai' | 'anthropic';
  privacyMode?: 'local-only' | 'ask-before-cloud' | 'cloud-allowed';
}

export class ReBIMGateway {
  private mcpServer: McpServer;
  private providerRouter: ProviderRouter;
  private ipcClient: IpcClient;
  private auditLogger: AuditLogger;
  private toolRegistry: ToolRegistry;
  private config: GatewayConfig;

  constructor(config: GatewayConfig = {}) {
    this.config = {
      port: 3000,
      host: 'localhost',
      defaultProvider: 'ollama',
      privacyMode: 'local-only',
      ...config
    };

    this.auditLogger = new AuditLogger();
    this.toolRegistry = new ToolRegistry();
    this.ipcClient = new IpcClient();
    this.providerRouter = new ProviderRouter(this.config);
    this.mcpServer = new McpServer(this.toolRegistry, this.ipcClient, this.auditLogger);
  }

  async start(): Promise<void> {
    console.log('Starting ReBIM Copilot Gateway...');
    
    // Connect to Revit IPC
    await this.ipcClient.connect();
    console.log('Connected to Revit IPC');

    // Start MCP server
    await this.mcpServer.start();
    console.log('MCP Server started');

    // Start provider health checks
    this.providerRouter.startHealthChecks();
    console.log('Provider health checks started');

    console.log(`ReBIM Copilot Gateway ready on ${this.config.host}:${this.config.port}`);
  }

  async stop(): Promise<void> {
    console.log('Stopping ReBIM Copilot Gateway...');
    await this.mcpServer.stop();
    await this.ipcClient.disconnect();
    this.providerRouter.stopHealthChecks();
    console.log('ReBIM Copilot Gateway stopped');
  }

  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const gateway = new ReBIMGateway();
  
  gateway.start().catch(console.error);

  process.on('SIGINT', async () => {
    await gateway.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await gateway.stop();
    process.exit(0);
  });
}
