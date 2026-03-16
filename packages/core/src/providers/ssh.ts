/**
 * SSH Deployment Provider
 * 
 * SOLID: Single Responsibility - only handles SSH deployment
 */

import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync } from "fs";
import type { DeploymentProvider, DeploymentConfig, DeploymentResult } from "./types.js";

const execAsync = promisify(exec);

export class SSHProvider implements DeploymentProvider {
  name = "ssh";
  description = "Deploy via SSH to remote server";

  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      // Step 1: Validate config
      this.validateConfig(config);

      // Step 2: Build locally
      console.log("🔨 Building locally...");
      await this.buildLocally(config.localPath);

      // Step 3: Copy files to server
      console.log("📤 Copying files to server...");
      await this.copyToServer(config);

      // Step 4: Start services on remote
      console.log("🚀 Starting services on remote...");
      await this.startRemoteServices(config);

      return {
        success: true,
        message: `Deployed successfully to ${config.host}`,
        url: `http://${config.host}`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Deployment failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async status(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      const command = this.buildSSHCommand(config, "docker ps");
      const { stdout } = await execAsync(command);
      
      return {
        success: true,
        message: "Services running",
        url: `http://${config.host}`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Cannot check status",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private validateConfig(config: DeploymentConfig): void {
    if (!config.host) throw new Error("Host is required");
    if (!config.user) throw new Error("User is required");
    if (!config.privateKey && !config.password) {
      throw new Error("Either privateKey or password is required");
    }
  }

  private async buildLocally(localPath: string): Promise<void> {
    // Build Docker images locally
    const { stdout, stderr } = await execAsync(
      `cd ${localPath} && docker-compose build`,
      { timeout: 300000 } // 5 minutes
    );
    
    if (stderr && stderr.includes("error")) {
      throw new Error(`Build failed: ${stderr}`);
    }
  }

  private async copyToServer(config: DeploymentConfig): Promise<void> {
    const sshOpts = this.buildSSHOptions(config);
    
    // Create remote directory
    await execAsync(
      `ssh ${sshOpts} ${config.user}@${config.host} "mkdir -p ${config.remotePath}"`
    );

    // Copy docker-compose.yml and .env
    await execAsync(
      `scp ${sshOpts} ${config.localPath}/docker-compose.yml ${config.user}@${config.host}:${config.remotePath}/`
    );
    
    if (config.environment) {
      const envContent = Object.entries(config.environment)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
      
      await execAsync(
        `echo "${envContent}" | ssh ${sshOpts} ${config.user}@${config.host} "cat > ${config.remotePath}/.env"`
      );
    }
  }

  private async startRemoteServices(config: DeploymentConfig): Promise<void> {
    const sshOpts = this.buildSSHOptions(config);
    
    // Pull and start services
    await execAsync(
      `ssh ${sshOpts} ${config.user}@${config.host} "cd ${config.remotePath} && docker-compose pull && docker-compose up -d"`,
      { timeout: 300000 }
    );
  }

  private buildSSHOptions(config: DeploymentConfig): string {
    const opts: string[] = [];
    
    if (config.port) {
      opts.push(`-p ${config.port}`);
    }
    
    if (config.privateKey) {
      opts.push(`-i ${config.privateKey}`);
    }
    
    // StrictHostKeyChecking=no for automation (use with caution)
    opts.push("-o StrictHostKeyChecking=no");
    opts.push("-o UserKnownHostsFile=/dev/null");
    
    return opts.join(" ");
  }

  private buildSSHCommand(config: DeploymentConfig, remoteCmd: string): string {
    const opts = this.buildSSHOptions(config);
    return `ssh ${opts} ${config.user}@${config.host} "${remoteCmd}"`;
  }
}
