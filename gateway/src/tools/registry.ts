/**
 * Tool Registry for ReBIM Copilot
 * Manages available tools, their schemas, and permissions
 */

export interface ToolDefinition {
  name: string;
  description: string;
  risk: 'READ' | 'UI' | 'SAFE_WRITE' | 'WRITE' | 'DESTRUCTIVE';
  modes: string[];
  parameters: Record<string, unknown>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private currentMode: string = 'Ask';
  private allowedTools: Set<string> = new Set();

  constructor() {
    this.loadDefaultTools();
    this.setMode('Ask');
  }

  private loadDefaultTools(): void {
    const defaultTools: ToolDefinition[] = [
      {
        name: 'get_project_info',
        description: 'Get project metadata and session info',
        risk: 'READ',
        modes: ['Ask', 'Analyze', 'Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_active_view',
        description: 'Get current active view context',
        risk: 'READ',
        modes: ['Ask', 'Analyze', 'Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_selection',
        description: 'Get currently selected elements',
        risk: 'READ',
        modes: ['Ask', 'Analyze', 'Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {
            maxResults: {
              type: 'number',
              description: 'Maximum number of elements to return',
              default: 100
            }
          }
        }
      },
      {
        name: 'get_element',
        description: 'Get element identity and details',
        risk: 'READ',
        modes: ['Ask', 'Analyze', 'Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {
            elementId: {
              type: 'string',
              description: 'Element ID'
            }
          },
          required: ['elementId']
        }
      },
      {
        name: 'get_element_properties',
        description: 'Get parameter values for an element',
        risk: 'READ',
        modes: ['Ask', 'Analyze', 'Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {
            elementId: {
              type: 'string',
              description: 'Element ID'
            }
          },
          required: ['elementId']
        }
      },
      {
        name: 'find_elements',
        description: 'Search elements with filters',
        risk: 'READ',
        modes: ['Analyze', 'Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            family: { type: 'string' },
            type: { type: 'string' },
            level: { type: 'string' },
            maxResults: { type: 'number', default: 50 }
          }
        }
      },
      {
        name: 'select_elements',
        description: 'Select elements by ID',
        risk: 'UI',
        modes: ['Ask', 'Analyze', 'Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {
            elementIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of element IDs'
            }
          },
          required: ['elementIds']
        }
      },
      {
        name: 'highlight_elements',
        description: 'Highlight elements visually',
        risk: 'UI',
        modes: ['Ask', 'Analyze', 'Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {
            elementIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of element IDs'
            }
          },
          required: ['elementIds']
        }
      },
      {
        name: 'set_parameter',
        description: 'Change one validated parameter (requires approval)',
        risk: 'SAFE_WRITE',
        modes: ['Edit', 'Automate'],
        parameters: {
          type: 'object',
          properties: {
            elementId: {
              type: 'string',
              description: 'Element ID'
            },
            parameter: {
              type: 'string',
              description: 'Parameter name'
            },
            value: {
              description: 'New value'
            },
            unit: {
              type: 'string',
              description: 'Unit of measurement'
            },
            expectedCurrentValue: {
              description: 'Expected current value for validation'
            }
          },
          required: ['elementId', 'parameter', 'value']
        }
      }
    ];

    for (const tool of defaultTools) {
      this.tools.set(tool.name, tool);
    }
  }

  setMode(mode: string): void {
    this.currentMode = mode;
    this.allowedTools.clear();
    
    for (const [name, tool] of this.tools) {
      if (tool.modes.includes(mode)) {
        this.allowedTools.add(name);
      }
    }
  }

  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  isToolAllowed(name: string): boolean {
    return this.allowedTools.has(name);
  }

  getAllowedTools(): ToolDefinition[] {
    return Array.from(this.allowedTools).map(name => this.tools.get(name)!);
  }

  getCurrentMode(): string {
    return this.currentMode;
  }
}
