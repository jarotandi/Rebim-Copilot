/**
 * RCP-02 Bridge Types
 * PRIVATE to RCP-02, NOT part of frozen RCP-00 semantic contract
 */

export interface BridgeRequest {
  bridgeVersion: number;
  requestId: string;
  operation: string;
  token?: string;
}

export interface BridgeResponse {
  bridgeVersion: number;
  requestId: string;
  ok: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export interface RuntimeDescriptor {
  bridgeVersion: number;
  processId: number;
  pipeName: string;
  token: string;
  startedAtUtc: string;
  addinVersion: string;
}

export interface ContextProbeResult {
  revitVersion: string;
  revitBuild: string;
  hasActiveDocument: boolean;
  executedOnExternalEvent: boolean;
}

export const BridgeOperations = {
  Authenticate: 'authenticate',
  Ping: 'ping',
  ContextProbe: 'context_probe',
} as const;

export const BridgeErrors = {
  AuthRequired: 'AUTH_REQUIRED',
  AuthFailed: 'AUTH_FAILED',
  MalformedFrame: 'MALFORMED_FRAME',
  FrameTooLarge: 'FRAME_TOO_LARGE',
  UnsupportedOperation: 'UNSUPPORTED_OPERATION',
  QueueFull: 'QUEUE_FULL',
  RequestTimeout: 'REQUEST_TIMEOUT',
  BridgeShuttingDown: 'BRIDGE_SHUTTING_DOWN',
  RevitContextBusy: 'REVIT_CONTEXT_BUSY',
  InternalError: 'INTERNAL_ERROR',
  AmbiguousRevitInstance: 'AMBIGUOUS_REVIT_INSTANCE',
  RevitInstanceNotFound: 'REVIT_INSTANCE_NOT_FOUND',
} as const;
