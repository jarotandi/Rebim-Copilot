/**
 * Approval Service for ReBIM Copilot
 * Manages approval tokens and execution plans for write operations
 */

import { v4 as uuidv4 } from 'crypto';
import { createHash } from 'crypto';

export interface ApprovalToken {
  id: string;
  proposalId: string;
  proposalHash: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface ExecutionPlan {
  proposalId: string;
  tool: string;
  arguments: Record<string, unknown>;
  contextRevision: string;
  approvalId: string;
}

export interface Proposal {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  contextRevision: string;
  before: unknown;
  after: unknown;
  riskLevel: 'low' | 'medium' | 'high';
}

export class ApprovalService {
  private approvals: Map<string, ApprovalToken> = new Map();
  private proposals: Map<string, Proposal> = new Map();
  private readonly approvalTimeoutMs: number = 300000; // 5 minutes

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Create a new proposal
   */
  createProposal(
    tool: string,
    args: Record<string, unknown>,
    contextRevision: string,
    before: unknown,
    after: unknown,
    riskLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Proposal {
    const proposal: Proposal = {
      id: this.generateId(),
      tool,
      arguments: args,
      contextRevision,
      before,
      after,
      riskLevel
    };

    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  /**
   * Request approval for a proposal
   */
  requestApproval(proposalId: string): ApprovalToken | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    const token: ApprovalToken = {
      id: this.generateId(),
      proposalId,
      proposalHash: this.hashProposal(proposal),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.approvalTimeoutMs),
      status: 'pending'
    };

    this.approvals.set(token.id, token);
    return token;
  }

  /**
   * Approve a proposal
   */
  approve(approvalId: string): boolean {
    const token = this.approvals.get(approvalId);
    if (!token) return false;
    if (token.status !== 'pending') return false;
    if (new Date() > token.expiresAt) {
      token.status = 'expired';
      return false;
    }

    token.status = 'approved';
    return true;
  }

  /**
   * Reject a proposal
   */
  reject(approvalId: string): boolean {
    const token = this.approvals.get(approvalId);
    if (!token) return false;
    if (token.status !== 'pending') return false;

    token.status = 'rejected';
    return true;
  }

  /**
   * Validate approval and create execution plan
   */
  validateAndCreateExecutionPlan(approvalId: string): ExecutionPlan | null {
    const token = this.approvals.get(approvalId);
    if (!token) return null;
    if (token.status !== 'approved') return null;

    const proposal = this.proposals.get(token.proposalId);
    if (!proposal) return null;

    // Verify proposal hasn't changed
    const currentHash = this.hashProposal(proposal);
    if (currentHash !== token.proposalHash) {
      return null;
    }

    return {
      proposalId: proposal.id,
      tool: proposal.tool,
      arguments: proposal.arguments,
      contextRevision: proposal.contextRevision,
      approvalId: token.id
    };
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId: string): Proposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Get approval by ID
   */
  getApproval(approvalId: string): ApprovalToken | undefined {
    return this.approvals.get(approvalId);
  }

  private generateId(): string {
    return uuidv4();
  }

  private hashProposal(proposal: Proposal): string {
    const data = JSON.stringify({
      tool: proposal.tool,
      arguments: proposal.arguments,
      contextRevision: proposal.contextRevision,
      before: proposal.before,
      after: proposal.after
    });
    return createHash('sha256').update(data).digest('hex');
  }

  private cleanup(): void {
    const now = new Date();
    
    for (const [id, token] of this.approvals) {
      if (token.status === 'pending' && now > token.expiresAt) {
        token.status = 'expired';
      }
    }

    // Remove old expired/rejected approvals
    for (const [id, token] of this.approvals) {
      if (token.status === 'expired' || token.status === 'rejected') {
        const age = now.getTime() - token.createdAt.getTime();
        if (age > 3600000) { // 1 hour
          this.approvals.delete(id);
        }
      }
    }
  }
}
