export const REBIM_PROTOCOL_VERSION = '0.1.0' as const;

export type ReBIMHost = 'revit';
export type ToolMode = 'Ask' | 'Analyze' | 'Edit' | 'Automate';
export type ToolRisk = 'READ' | 'UI' | 'SAFE_WRITE' | 'WRITE' | 'DESTRUCTIVE';

export interface CommandEnvelope {
  protocolVersion: typeof REBIM_PROTOCOL_VERSION;
  requestId: string;
  host: ReBIMHost;
  command: string;
  contextRevision?: string;
  arguments: Record<string, unknown>;
}

export interface ErrorEnvelope {
  code: string;
  message: string;
  hint?: string;
  details?: unknown;
}

export type ResultEnvelope =
  | {
      protocolVersion: typeof REBIM_PROTOCOL_VERSION;
      requestId: string;
      ok: true;
      result: unknown;
    }
  | {
      protocolVersion: typeof REBIM_PROTOCOL_VERSION;
      requestId: string;
      ok: false;
      error: ErrorEnvelope;
    };

export interface ToolDefinition {
  name: string;
  description: string;
  risk: ToolRisk;
  modes: ToolMode[];
  mutatesModel: boolean;
  requiresApproval: boolean;
  parameters: Record<string, unknown>;
}
