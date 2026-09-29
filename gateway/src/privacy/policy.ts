/**
 * Privacy Policy Engine for ReBIM Copilot
 * Controls data flow between local and cloud providers
 */

export type PrivacyMode = 'local-only' | 'ask-before-cloud' | 'cloud-allowed';

export interface DataCategory {
  name: string;
  description: string;
  sensitive: boolean;
  allowedInLocalOnly: boolean;
}

export interface CloudSendManifest {
  categories: string[];
  timestamp: Date;
  approved: boolean;
}

export class PrivacyPolicyEngine {
  private mode: PrivacyMode;
  private dataCategories: Map<string, DataCategory> = new Map();
  private pendingManifests: Map<string, CloudSendManifest> = new Map();

  constructor(mode: PrivacyMode = 'local-only') {
    this.mode = mode;
    this.initializeDataCategories();
  }

  private initializeDataCategories(): void {
    const categories: DataCategory[] = [
      {
        name: 'project_metadata',
        description: 'Project name, version, and basic info',
        sensitive: false,
        allowedInLocalOnly: true
      },
      {
        name: 'element_properties',
        description: 'BIM element parameters and properties',
        sensitive: false,
        allowedInLocalOnly: true
      },
      {
        name: 'geometry_data',
        description: 'Geometric data and coordinates',
        sensitive: true,
        allowedInLocalOnly: false
      },
      {
        name: 'file_paths',
        description: 'Local file system paths',
        sensitive: true,
        allowedInLocalOnly: false
      },
      {
        name: 'user_prompts',
        description: 'User conversation and prompts',
        sensitive: true,
        allowedInLocalOnly: false
      },
      {
        name: 'project_files',
        description: 'Full project file content',
        sensitive: true,
        allowedInLocalOnly: false
      }
    ];

    for (const cat of categories) {
      this.dataCategories.set(cat.name, cat);
    }
  }

  setMode(mode: PrivacyMode): void {
    this.mode = mode;
  }

  getMode(): PrivacyMode {
    return this.mode;
  }

  /**
   * Check if data can be sent to cloud
   */
  canSendToCloud(categoryName: string): boolean {
    if (this.mode === 'local-only') {
      return false;
    }

    const category = this.dataCategories.get(categoryName);
    if (!category) {
      return false;
    }

    if (this.mode === 'cloud-allowed') {
      return true;
    }

    // ask-before-cloud mode
    return category.allowedInLocalOnly;
  }

  /**
   * Get list of data categories that would be sent to cloud
   */
  getCloudSendManifest(): CloudSendManifest {
    const categories: string[] = [];
    
    for (const [name, category] of this.dataCategories) {
      if (!category.allowedInLocalOnly) {
        categories.push(name);
      }
    }

    return {
      categories,
      timestamp: new Date(),
      approved: false
    };
  }

  /**
   * Request approval for cloud data send
   */
  requestCloudSendApproval(manifest: CloudSendManifest): string {
    const id = `manifest_${Date.now()}`;
    this.pendingManifests.set(id, manifest);
    return id;
  }

  /**
   * Approve cloud data send
   */
  approveCloudSend(manifestId: string): boolean {
    const manifest = this.pendingManifests.get(manifestId);
    if (!manifest) return false;

    manifest.approved = true;
    return true;
  }

  /**
   * Get all data categories
   */
  getDataCategories(): DataCategory[] {
    return Array.from(this.dataCategories.values());
  }

  /**
   * Check if current mode allows cloud usage
   */
  isCloudAllowed(): boolean {
    return this.mode !== 'local-only';
  }

  /**
   * Get privacy summary for UI display
   */
  getPrivacySummary(): {
    mode: PrivacyMode;
    cloudAllowed: boolean;
    sensitiveCategories: string[];
  } {
    const sensitiveCategories: string[] = [];
    
    for (const [name, category] of this.dataCategories) {
      if (category.sensitive) {
        sensitiveCategories.push(name);
      }
    }

    return {
      mode: this.mode,
      cloudAllowed: this.isCloudAllowed(),
      sensitiveCategories
    };
  }
}
