/**
 * @easyploy/plugin-sdk — Shared domain types for plugins.
 * Used by core and all plugin packages.
 */

export type PluginKind =
  | "stack"
  | "provisioner"
  | "runtime"
  | "reverse_proxy"
  | "secrets"
  | "backup"
  | "dns"
  | "monitoring"

export interface PluginRef {
  plugin: string
  version?: string
  config?: Record<string, unknown>
}

export interface CapabilityMap {
  createServer?: boolean
  attachVolume?: boolean
  setFirewall?: boolean
  hostConnection?: boolean
  deployCompose?: boolean
  issueTls?: boolean
  manageDns?: boolean
  createBackups?: boolean
  restoreBackups?: boolean
}

export interface HostConnection {
  host: string
  user: string
  port: number
  sshKeyPath?: string
  ipv4?: string
  ipv6?: string
}

export interface ProvisionResult {
  host: string
  user: string
  port: number
  sshKeyPath?: string
  ipv4?: string
  ipv6?: string
  metadata?: Record<string, unknown>
}

export interface ExecutionContext {
  cwd: string
  env: Record<string, string>
  dryRun?: boolean
  nonInteractive?: boolean
}

export interface DeployArtifact {
  kind: string
  files: Array<{ path: string; content: string; mode?: number }>
  env?: Record<string, string>
  metadata?: Record<string, unknown>
}

export interface HealthCheckDefinition {
  name: string
  type: "http" | "tcp" | "command"
  target: string
  intervalSeconds?: number
  timeoutSeconds?: number
}

export interface SecretSpec {
  name: string
  type: "random" | "env" | "file"
  length?: number
  envKey?: string
}

export interface SecretBundle {
  secrets: Record<string, string>
}
