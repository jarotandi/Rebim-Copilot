/**
 * Audit Logger for ReBIM Copilot
 * Structured logging for all AI/tool actions
 */

import * as fs from 'fs';
import * as path from 'path';

export interface AuditEvent {
  timestamp: string;
  runId: string;
  type: string;
  data: Record<string, unknown>;
}

export class AuditLogger {
  private logDir: string;
  private currentRunId: string;
  private logStream: fs.WriteStream | null = null;

  constructor(logDir?: string) {
    this.logDir = logDir || path.join(
      process.env.LOCALAPPDATA || process.env.HOME || '.',
      'ReBIM', 'Copilot', 'audit'
    );
    this.currentRunId = this.generateRunId();
    this.ensureLogDirectory();
  }

  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `audit_${date}.jsonl`);
  }

  async log(type: string, data: Record<string, unknown>): Promise<void> {
    const event: AuditEvent = {
      timestamp: new Date().toISOString(),
      runId: this.currentRunId,
      type,
      data: this.sanitizeData(data)
    };

    const logLine = JSON.stringify(event) + '\n';

    // Write to file
    fs.appendFileSync(this.getLogFileName(), logLine);

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUDIT] ${type}:`, data);
    }
  }

  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Mask sensitive fields
      if (this.isSensitiveField(key)) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveField(key: string): boolean {
    const sensitivePatterns = [
      'password', 'secret', 'token', 'key', 'apikey', 'api_key',
      'credential', 'auth', 'private'
    ];
    const lowerKey = key.toLowerCase();
    return sensitivePatterns.some(pattern => lowerKey.includes(pattern));
  }

  startNewRun(): string {
    this.currentRunId = this.generateRunId();
    return this.currentRunId;
  }

  getCurrentRunId(): string {
    return this.currentRunId;
  }

  async getAuditTrail(runId?: string): Promise<AuditEvent[]> {
    const targetRunId = runId || this.currentRunId;
    const events: AuditEvent[] = [];

    // Read all log files
    const logFiles = fs.readdirSync(this.logDir)
      .filter(f => f.endsWith('.jsonl'));

    for (const file of logFiles) {
      const filePath = path.join(this.logDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const event: AuditEvent = JSON.parse(line);
          if (event.runId === targetRunId) {
            events.push(event);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    return events;
  }
}
