/**
 * Context Snapshot Service for ReBIM Copilot
 * Manages context revision and stale detection
 */

import { createHash } from 'crypto';

export interface ContextSnapshot {
  revision: string;
  timestamp: Date;
  documentState: string;
  viewState: string;
  selectionState: string;
  elementStates: Map<string, string>;
}

export interface ContextRevision {
  revision: string;
  timestamp: Date;
  isValid: boolean;
}

export class ContextSnapshotService {
  private snapshots: Map<string, ContextSnapshot> = new Map();
  private currentRevision: string = '';

  /**
   * Generate context revision hash
   */
  generateRevision(data: {
    documentState: string;
    viewState: string;
    selectionState: string;
    elementStates?: Record<string, string>;
  }): string {
    const hashData = JSON.stringify({
      doc: data.documentState,
      view: data.viewState,
      selection: data.selectionState,
      elements: data.elementStates || {}
    });

    return createHash('sha256').update(hashData).digest('hex').substring(0, 16);
  }

  /**
   * Create a new context snapshot
   */
  createSnapshot(
    documentState: string,
    viewState: string,
    selectionState: string,
    elementStates?: Record<string, string>
  ): ContextSnapshot {
    const revision = this.generateRevision({
      documentState,
      viewState,
      selectionState,
      elementStates
    });

    const snapshot: ContextSnapshot = {
      revision,
      timestamp: new Date(),
      documentState,
      viewState,
      selectionState,
      elementStates: new Map(Object.entries(elementStates || {}))
    };

    this.snapshots.set(revision, snapshot);
    this.currentRevision = revision;

    return snapshot;
  }

  /**
   * Validate if a context revision is still valid
   */
  validateRevision(revision: string, currentState: {
    documentState: string;
    viewState: string;
    selectionState: string;
    elementStates?: Record<string, string>;
  }): ContextRevision {
    const snapshot = this.snapshots.get(revision);
    
    if (!snapshot) {
      return {
        revision,
        timestamp: new Date(),
        isValid: false
      };
    }

    const currentRevision = this.generateRevision(currentState);
    
    return {
      revision: currentRevision,
      timestamp: new Date(),
      isValid: currentRevision === revision
    };
  }

  /**
   * Get snapshot by revision
   */
  getSnapshot(revision: string): ContextSnapshot | undefined {
    return this.snapshots.get(revision);
  }

  /**
   * Get current revision
   */
  getCurrentRevision(): string {
    return this.currentRevision;
  }

  /**
   * Check if element state has changed
   */
  hasElementChanged(elementId: string, newState: string): boolean {
    const snapshot = this.snapshots.get(this.currentRevision);
    if (!snapshot) return true;

    const oldState = snapshot.elementStates.get(elementId);
    return oldState !== newState;
  }

  /**
   * Clean up old snapshots
   */
  cleanup(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    
    for (const [revision, snapshot] of this.snapshots) {
      const age = now - snapshot.timestamp.getTime();
      if (age > maxAgeMs) {
        this.snapshots.delete(revision);
      }
    }
  }
}
