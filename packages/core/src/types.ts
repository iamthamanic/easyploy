/**
 * @easyploy/core — Internal types for engine and planner.
 */

import type { EasyployConfig } from "@easyploy/config"
import type {
  BackupPlugin,
  DnsPlugin,
  ProvisionerPlugin,
  ReverseProxyPlugin,
  RuntimePlugin,
  SecretsPlugin,
  StackPlugin,
} from "@easyploy/plugin-sdk"

export interface ResolvedPlugins {
  stack: StackPlugin
  provisioner: ProvisionerPlugin
  runtime: RuntimePlugin
  proxy?: ReverseProxyPlugin
  secrets: SecretsPlugin
  backup?: BackupPlugin
  dns?: DnsPlugin
}

export interface DeploymentPlan {
  steps: PlanStep[]
  config: EasyployConfig
  plugins: ResolvedPlugins
}

export interface PlanStep {
  id: string
  name: string
  description?: string
  kind: "provision" | "install" | "secrets" | "build" | "deploy" | "proxy" | "dns" | "backup" | "health"
}

export interface EngineContext {
  cwd: string
  config: EasyployConfig
  dryRun: boolean
  nonInteractive: boolean
}
