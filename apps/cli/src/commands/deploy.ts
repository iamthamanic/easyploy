/**
 * Deploy Command
 * 
 * SOLID: Orchestrates deployment via different providers
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { SSHProvider } from "@easyploy/core/providers/ssh.js";
import type { DeploymentConfig, DeploymentProvider } from "@easyploy/core/providers/types.js";

interface DeployOptions {
  provider: string;
  host?: string;
  port?: number;
  user?: string;
  key?: string;
  path?: string;
  env?: string;
}

export async function cmdDeploy(opts: DeployOptions): Promise<void> {
  console.log("🚀 easyploy deploy\n");

  const provider = getProvider(opts.provider);
  if (!provider) {
    console.error(`❌ Unknown provider: ${opts.provider}`);
    console.log("Available providers: ssh, coolify");
    process.exit(1);
  }

  console.log(`Using provider: ${provider.name} - ${provider.description}\n`);

  try {
    const config = await buildConfig(opts);
    
    console.log("📋 Deployment configuration:");
    console.log(`  Host: ${config.host}`);
    console.log(`  User: ${config.user}`);
    console.log(`  Remote path: ${config.remotePath}`);
    console.log(`  Local path: ${config.localPath}\n`);

    const result = await provider.deploy(config);

    if (result.success) {
      console.log("✅ Deployment successful!");
      console.log(`🌐 URL: ${result.url}`);
      console.log(`📖 ${result.message}`);
    } else {
      console.error("❌ Deployment failed");
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function getProvider(name: string): DeploymentProvider | null {
  const providers: Record<string, DeploymentProvider> = {
    ssh: new SSHProvider(),
    // coolify: new CoolifyProvider(), // TODO: Implement
  };

  return providers[name] || null;
}

async function buildConfig(opts: DeployOptions): Promise<DeploymentConfig> {
  // Load from config file or environment
  const configPath = resolve(process.cwd(), "easyploy.config.json");
  let fileConfig: Partial<DeploymentConfig> = {};

  try {
    const content = readFileSync(configPath, "utf-8");
    fileConfig = JSON.parse(content);
  } catch {
    // No config file, use CLI options
  }

  // Merge: CLI options > file config > defaults
  return {
    host: opts.host || fileConfig.host || "",
    port: opts.port || fileConfig.port || 22,
    user: opts.user || fileConfig.user || "root",
    privateKey: opts.key || fileConfig.privateKey || "~/.ssh/id_ed25519",
    localPath: resolve(process.cwd()),
    remotePath: opts.path || fileConfig.remotePath || "/opt/easyploy",
    environment: fileConfig.environment || {},
  };
}
