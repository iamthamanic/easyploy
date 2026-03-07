/**
 * @easyploy/core — Resolve plugin refs to plugin instances. No hardcoded tools.
 */

import type { PluginRef } from "@easyploy/plugin-sdk"
import type { EasyployConfig } from "@easyploy/config"
import type { ResolvedPlugins } from "./types.js"
import type {
  BackupPlugin,
  DnsPlugin,
  ProvisionerPlugin,
  ReverseProxyPlugin,
  RuntimePlugin,
  SecretsPlugin,
  StackPlugin,
} from "@easyploy/plugin-sdk"
import { ResolverError } from "./errors.js"

export type PluginLoader = (ref: PluginRef) => Promise<unknown>

let defaultLoader: PluginLoader | null = null

export function setPluginLoader(loader: PluginLoader): void {
  defaultLoader = loader
}

function getLoader(): PluginLoader {
  if (!defaultLoader) {
    throw new ResolverError("Plugin loader not set. Call setPluginLoader() before resolve().")
  }
  return defaultLoader
}

async function loadPlugin(ref: PluginRef, kind: string): Promise<unknown> {
  const loader = getLoader()
  const mod = await loader(ref)
  if (!mod || typeof mod !== "object") {
    throw new ResolverError(`Plugin ${ref.plugin} did not export a valid plugin`)
  }
  const plugin = (mod as { default?: unknown }).default ?? mod
  const meta = (plugin as { meta?: { kind?: string } }).meta
  if (!meta?.kind) {
    throw new ResolverError(`Plugin ${ref.plugin} has no meta.kind`)
  }
  if (meta.kind !== kind) {
    throw new ResolverError(`Plugin ${ref.plugin} is kind "${meta.kind}", expected "${kind}"`)
  }
  return plugin
}

export async function resolvePlugins(config: EasyployConfig): Promise<ResolvedPlugins> {
  const stack = (await loadPlugin(
    { plugin: config.stack.plugin, version: undefined, config: config.stack.config },
    "stack"
  )) as StackPlugin

  const provisioner = (await loadPlugin(config.toolchain.provisioner, "provisioner")) as ProvisionerPlugin
  const runtime = (await loadPlugin(config.toolchain.runtime, "runtime")) as RuntimePlugin
  const secrets = (await loadPlugin(config.toolchain.secrets, "secrets")) as SecretsPlugin

  let proxy: ReverseProxyPlugin | undefined
  if (config.toolchain.proxy) {
    proxy = (await loadPlugin(config.toolchain.proxy, "reverse_proxy")) as ReverseProxyPlugin
  }

  let backup: BackupPlugin | undefined
  if (config.toolchain.backup?.plugin && config.toolchain.backup.plugin !== "none") {
    backup = (await loadPlugin(config.toolchain.backup, "backup")) as BackupPlugin
  }

  let dns: DnsPlugin | undefined
  if (config.toolchain.dns?.plugin && config.toolchain.dns.plugin !== "manual") {
    dns = (await loadPlugin(config.toolchain.dns, "dns")) as DnsPlugin
  }

  return {
    stack,
    provisioner,
    runtime,
    proxy,
    secrets,
    backup,
    dns,
  }
}
