/**
 * @easyploy/plugin-sdk — Contract helpers for plugin validation.
 */

import type { EasyployPlugin } from "./interfaces.js"

export function assertPluginMeta(plugin: unknown): asserts plugin is EasyployPlugin {
  if (!plugin || typeof plugin !== "object") {
    throw new Error("Plugin must be an object")
  }
  const p = plugin as Record<string, unknown>
  if (!p.meta || typeof p.meta !== "object") {
    throw new Error("Plugin must have meta: { name, version, kind }")
  }
  const meta = p.meta as Record<string, unknown>
  if (typeof meta.name !== "string" || !meta.name) {
    throw new Error("Plugin meta.name must be a non-empty string")
  }
  if (typeof meta.version !== "string" || !meta.version) {
    throw new Error("Plugin meta.version must be a non-empty string")
  }
  if (typeof meta.kind !== "string" || !meta.kind) {
    throw new Error("Plugin meta.kind must be a non-empty string")
  }
  if (!p.capabilities || typeof p.capabilities !== "object") {
    throw new Error("Plugin must have capabilities object")
  }
  if (typeof p.validateConfig !== "function") {
    throw new Error("Plugin must implement validateConfig(config)")
  }
}

export const PLUGIN_KINDS = [
  "stack",
  "provisioner",
  "runtime",
  "reverse_proxy",
  "secrets",
  "backup",
  "dns",
  "monitoring",
] as const

export function isKnownPluginKind(kind: string): kind is (typeof PLUGIN_KINDS)[number] {
  return (PLUGIN_KINDS as readonly string[]).includes(kind)
}
