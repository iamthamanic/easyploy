/**
 * @easyploy/core — Deployment engine. Orchestrates plugins; no tool-specific code.
 */

import type { EasyployConfig } from "@easyploy/config"
import type { ExecutionContext, HostConnection, ProvisionResult } from "@easyploy/plugin-sdk"
import type { ResolvedPlugins } from "../types.js"
import type { EngineContext } from "../types.js"
import { createPlan, validatePlan } from "../planner.js"
import { validateConfigWithPlugins, requireProvisionerConfig } from "../validation.js"

export interface PlanResult {
  steps: Array<{ id: string; name: string; description?: string }>
  config: EasyployConfig
}

export async function plan(ctx: EngineContext, resolve: (config: EasyployConfig) => Promise<ResolvedPlugins>): Promise<PlanResult> {
  const plugins = await resolve(ctx.config)
  await validateConfigWithPlugins(ctx.config, plugins)
  requireProvisionerConfig(ctx.config)
  const deploymentPlan = createPlan(ctx.config, plugins)
  validatePlan(deploymentPlan)
  return {
    steps: deploymentPlan.steps,
    config: ctx.config,
  }
}

export function createExecutionContext(ctx: EngineContext): ExecutionContext {
  return {
    cwd: ctx.cwd,
    env: { ...process.env } as Record<string, string>,
    dryRun: ctx.dryRun,
    nonInteractive: ctx.nonInteractive,
  }
}

export async function provision(
  plugins: ResolvedPlugins,
  config: EasyployConfig,
  execCtx: ExecutionContext
): Promise<ProvisionResult> {
  return plugins.provisioner.provision(
    config.toolchain.provisioner.config ?? {},
    execCtx
  )
}

export async function buildStack(
  plugins: ResolvedPlugins,
  config: EasyployConfig,
  execCtx: ExecutionContext
) {
  return plugins.stack.build(config.stack.config ?? {}, execCtx)
}

export function hostFromProvision(result: ProvisionResult): HostConnection {
  return {
    host: result.host,
    user: result.user,
    port: result.port,
    sshKeyPath: result.sshKeyPath,
    ipv4: result.ipv4,
    ipv6: result.ipv6,
  }
}
