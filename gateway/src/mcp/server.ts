/**
 * MCP Server for ReBIM Copilot
 * Exposes Revit capabilities as MCP tools/resources
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry } from '../tools/registry.js';
import { IpcClient } from '../ipc/client.js';
import { AuditLogger } from '../audit/logger.js';

export class McpServer {
  private server: Server;
  private transport: StdioServerTransport;
  private toolRegistry: ToolRegistry;
  private ipcClient: IpcClient;
  private auditLogger: AuditLogger;

  constructor(toolRegistry: ToolRegistry, ipcClient: IpcClient, auditLogger: AuditLogger) {
    this.toolRegistry = toolRegistry;
    this.ipcClient = ipcClient;
    this.auditLogger = auditLogger;

    this.server = new Server(
      {
        name: 'rebim-copilot',
        version: '0.1.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this.transport = new StdioServerTransport();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.toolRegistry.getAllowedTools();
      return {
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.parameters
        }))
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      await this.auditLogger.log('tool_called', {
        tool: name,
        arguments: args
      });

      try {
        const tool = this.toolRegistry.getTool(name);
        if (!tool) {
          throw new Error(`Unknown tool: ${name}`);
        }

        if (!this.toolRegistry.isToolAllowed(name)) {
          throw new Error(`Tool ${name} not allowed in current mode`);
        }

        const response = await this.ipcClient.sendRequest(name, args || {});

        if (!response.ok) {
          throw new Error(response.error?.message || 'Tool execution failed');
        }

        await this.auditLogger.log('tool_result', {
          tool: name,
          success: true
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response.result, null, 2)
          }]
        };
      } catch (error) {
        await this.auditLogger.log('tool_result', {
          tool: name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'rebim://project/info',
          name: 'Project Information',
          description: 'Current project metadata'
        },
        {
          uri: 'rebim://view/active',
          name: 'Active View',
          description: 'Current active view context'
        },
        {
          uri: 'rebim://selection/current',
          name: 'Current Selection',
          description: 'Currently selected elements'
        }
      ]
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      let command: string;
      if (uri === 'rebim://project/info') {
        command = 'get_project_info';
      } else if (uri === 'rebim://view/active') {
        command = 'get_active_view';
      } else if (uri === 'rebim://selection/current') {
        command = 'get_selection';
      } else {
        throw new Error(`Unknown resource: ${uri}`);
      }

      const response = await this.ipcClient.sendRequest(command, {});

      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(response.result, null, 2)
        }]
      };
    });
  }

  async start(): Promise<void> {
    await this.server.connect(this.transport);
    console.log('MCP Server connected via stdio');
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}
