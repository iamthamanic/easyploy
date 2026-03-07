/**
 * @easyploy/plugin-sdk — Plugin interfaces. Core depends only on these.
 */

import type {
  CapabilityMap,
  DeployArtifact,
  ExecutionContext,
  HealthCheckDefinition,
  HostConnection,
  PluginRef,
  ProvisionResult,
  SecretBundle,
  SecretSpec,
} from "./types.js"

export interface EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: string
  }
  capabilities: Record<string, boolean>
  validateConfig(config: unknown): Promise<void>
}

export interface ProvisionerPlugin extends EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: "provisioner"
  }
  provision(config: unknown, ctx: ExecutionContext): Promise<ProvisionResult>
  destroy?(config: unknown, ctx: ExecutionContext): Promise<void>
  status?(config: unknown, ctx: ExecutionContext): Promise<Record<string, unknown>>
}

export interface RuntimePlugin extends EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: "runtime"
  }
  install(config: unknown, host: HostConnection, ctx: ExecutionContext): Promise<void>
  deploy(
    config: unknown,
    artifact: DeployArtifact,
    host: HostConnection,
    ctx: ExecutionContext
  ): Promise<void>
  update?(
    config: unknown,
    artifact: DeployArtifact,
    host: HostConnection,
    ctx: ExecutionContext
  ): Promise<void>
  remove?(
    config: unknown,
    artifact: DeployArtifact,
    host: HostConnection,
    ctx: ExecutionContext
  ): Promise<void>
}

export interface StackPlugin extends EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: "stack"
  }
  requiredCapabilities(): string[]
  build(config: unknown, ctx: ExecutionContext): Promise<DeployArtifact>
  healthChecks(config: unknown): HealthCheckDefinition[]
}

export interface SecretsPlugin extends EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: "secrets"
  }
  generate(
    config: unknown,
    spec: SecretSpec[],
    ctx: ExecutionContext
  ): Promise<SecretBundle>
  renderEnv(
    config: unknown,
    bundle: SecretBundle,
    ctx: ExecutionContext
  ): Promise<Record<string, string>>
}

export interface ReverseProxyPlugin extends EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: "reverse_proxy"
  }
  configure?(
    config: unknown,
    host: HostConnection,
    routes: ProxyRoute[],
    ctx: ExecutionContext
  ): Promise<void>
  install?(config: unknown, host: HostConnection, ctx: ExecutionContext): Promise<void>
}

export interface ProxyRoute {
  hostname: string
  upstream: string
  tls?: boolean
}

export interface BackupPlugin extends EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: "backup"
  }
  configure?(
    config: unknown,
    host: HostConnection,
    spec: BackupSpec,
    ctx: ExecutionContext
  ): Promise<void>
  run?(config: unknown, host: HostConnection, ctx: ExecutionContext): Promise<void>
  restore?(config: unknown, host: HostConnection, target: string, ctx: ExecutionContext): Promise<void>
}

export interface BackupSpec {
  database?: string
  target: string
  schedule?: string
}

export interface DnsPlugin extends EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: "dns"
  }
  createRecord?(
    config: unknown,
    record: DnsRecord,
    ctx: ExecutionContext
  ): Promise<void>
  deleteRecord?(config: unknown, record: DnsRecord, ctx: ExecutionContext): Promise<void>
}

export interface DnsRecord {
  type: "A" | "AAAA" | "CNAME"
  name: string
  value: string
  ttl?: number
}

export interface MonitoringPlugin extends EasyployPlugin {
  meta: {
    name: string
    version: string
    kind: "monitoring"
  }
  configure?(
    config: unknown,
    host: HostConnection,
    targets: string[],
    ctx: ExecutionContext
  ): Promise<void>
}

export type AnyPlugin =
  | ProvisionerPlugin
  | RuntimePlugin
  | StackPlugin
  | SecretsPlugin
  | ReverseProxyPlugin
  | BackupPlugin
  | DnsPlugin
  | MonitoringPlugin
