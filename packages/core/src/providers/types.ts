/**
 * Deployment Provider Interface
 * 
 * SOLID: Abstraction for different deployment targets
 */

export interface DeploymentConfig {
  host: string;
  port?: number;
  user: string;
  privateKey?: string;
  password?: string;
  localPath: string;
  remotePath: string;
  environment?: Record<string, string>;
}

export interface DeploymentResult {
  success: boolean;
  message: string;
  url?: string;
  error?: string;
}

export interface DeploymentProvider {
  name: string;
  description: string;
  deploy(config: DeploymentConfig): Promise<DeploymentResult>;
  rollback?(config: DeploymentConfig): Promise<DeploymentResult>;
  status?(config: DeploymentConfig): Promise<DeploymentResult>;
}
