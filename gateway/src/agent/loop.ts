/**
 * Agent Loop for ReBIM Copilot
 * Orchestrates AI tool calling with MCP tools
 */

import { ToolRegistry } from '../tools/registry.js';
import { IpcClient } from '../ipc/client.js';
import { AuditLogger } from '../audit/logger.js';
import { AIProvider } from '../providers/router.js';

export interface AgentConfig {
  maxIterations: number;
  timeoutMs: number;
}

export interface AgentResult {
  response: string;
  toolCalls: ToolCall[];
  iterations: number;
}

export interface ToolCall {
  tool: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export class AgentLoop {
  private toolRegistry: ToolRegistry;
  private ipcClient: IpcClient;
  private auditLogger: AuditLogger;
  private config: AgentConfig;

  constructor(
    toolRegistry: ToolRegistry,
    ipcClient: IpcClient,
    auditLogger: AuditLogger,
    config: AgentConfig = { maxIterations: 10, timeoutMs: 60000 }
  ) {
    this.toolRegistry = toolRegistry;
    this.ipcClient = ipcClient;
    this.auditLogger = auditLogger;
    this.config = config;
  }

  async run(
    provider: AIProvider,
    messages: Array<{ role: string; content: string }>
  ): Promise<AgentResult> {
    const toolCalls: ToolCall[] = [];
    let iterations = 0;
    let currentMessages = [...messages];

    // Get available tools for current mode
    const availableTools = this.toolRegistry.getAllowedTools();
    const toolDefinitions = availableTools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));

    while (iterations < this.config.maxIterations) {
      iterations++;

      await this.auditLogger.log('agent_iteration', {
        iteration: iterations,
        messageCount: currentMessages.length
      });

      try {
        // Call provider
        const response = await provider.chat(currentMessages, toolDefinitions);
        const responseObj = response as { choices?: Array<{ message?: { content?: string; tool_calls?: unknown[] } }> };
        
        const assistantMessage = responseObj.choices?.[0]?.message;
        if (!assistantMessage) {
          break;
        }

        // Add assistant message to history
        currentMessages.push({
          role: 'assistant',
          content: assistantMessage.content || ''
        });

        // Check for tool calls
        const toolCallsInResponse = assistantMessage.tool_calls;
        if (!toolCallsInResponse || toolCallsInResponse.length === 0) {
          // No more tool calls, we're done
          return {
            response: assistantMessage.content || '',
            toolCalls,
            iterations
          };
        }

        // Execute tool calls
        for (const toolCall of toolCallsInResponse) {
          const toolCallObj = toolCall as { function: { name: string; arguments: string } };
          const toolName = toolCallObj.function.name;
          const toolArgs = JSON.parse(toolCallObj.function.arguments);

          await this.auditLogger.log('tool_call', {
            tool: toolName,
            arguments: toolArgs
          });

          // Validate tool is allowed
          if (!this.toolRegistry.isToolAllowed(toolName)) {
            const errorResult = {
              error: `Tool ${toolName} is not allowed in current mode`
            };
            toolCalls.push({
              tool: toolName,
              arguments: toolArgs,
              result: errorResult
            });
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify(errorResult)
            });
            continue;
          }

          // Execute tool via IPC
          try {
            const result = await this.ipcClient.sendRequest(toolName, toolArgs);
            toolCalls.push({
              tool: toolName,
              arguments: toolArgs,
              result
            });

            currentMessages.push({
              role: 'tool',
              content: JSON.stringify(result)
            });
          } catch (error) {
            const errorResult = {
              error: error instanceof Error ? error.message : 'Tool execution failed'
            };
            toolCalls.push({
              tool: toolName,
              arguments: toolArgs,
              result: errorResult
            });
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify(errorResult)
            });
          }
        }
      } catch (error) {
        await this.auditLogger.log('agent_error', {
          iteration: iterations,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        break;
      }
    }

    // Max iterations reached
    return {
      response: 'Maximum iterations reached. Please try again.',
      toolCalls,
      iterations
    };
  }
}
