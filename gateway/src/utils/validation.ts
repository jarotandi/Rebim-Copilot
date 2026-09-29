/**
 * Validation utilities for ReBIM Copilot
 */

import { z } from 'zod';

// Command envelope validation
export const CommandSchema = z.object({
  requestId: z.string(),
  host: z.enum(['revit']),
  command: z.string(),
  contextRevision: z.string().optional(),
  arguments: z.record(z.unknown())
});

// Result envelope validation
export const ResultSchema = z.object({
  requestId: z.string(),
  ok: z.boolean(),
  result: z.unknown().optional(),
  error: z.object({
    code: z.enum([
      'REBIM_VALIDATION_ERROR',
      'REBIM_CAPABILITY_UNAVAILABLE',
      'REBIM_PERMISSION_DENIED',
      'REBIM_STALE_CONTEXT',
      'REBIM_IPC_UNAVAILABLE',
      'REBIM_REVIT_CONTEXT_BUSY',
      'REBIM_EXECUTION_FAILED',
      'REBIM_PROVIDER_UNAVAILABLE',
      'REBIM_CLOUD_BLOCKED'
    ]),
    message: z.string(),
    hint: z.string().optional()
  }).optional()
});

// Context validation
export const ContextSchema = z.object({
  host: z.enum(['revit']),
  document: z.object({
    title: z.string(),
    version: z.string(),
    path: z.string().optional()
  }),
  view: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string()
  }),
  selection: z.array(z.object({
    id: z.string(),
    category: z.string(),
    family: z.string().optional(),
    type: z.string().optional(),
    level: z.string().optional(),
    parameters: z.record(z.object({
      value: z.unknown(),
      unit: z.string().optional(),
      type: z.string().optional()
    })).optional()
  })),
  revision: z.string()
});

// Tool arguments validation
export const SetParameterSchema = z.object({
  elementId: z.string(),
  parameter: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().optional(),
  expectedCurrentValue: z.unknown().optional()
});

export const FindElementsSchema = z.object({
  category: z.string().optional(),
  family: z.string().optional(),
  type: z.string().optional(),
  level: z.string().optional(),
  maxResults: z.number().positive().default(50)
});

export type Command = z.infer<typeof CommandSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type Context = z.infer<typeof ContextSchema>;
export type SetParameterArgs = z.infer<typeof SetParameterSchema>;
export type FindElementsArgs = z.infer<typeof FindElementsSchema>;

/**
 * Validate command envelope
 */
export function validateCommand(data: unknown): { success: true; data: Command } | { success: false; error: string } {
  const result = CommandSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}

/**
 * Validate result envelope
 */
export function validateResult(data: unknown): { success: true; data: Result } | { success: false; error: string } {
  const result = ResultSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}

/**
 * Validate context
 */
export function validateContext(data: unknown): { success: true; data: Context } | { success: false; error: string } {
  const result = ContextSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}
