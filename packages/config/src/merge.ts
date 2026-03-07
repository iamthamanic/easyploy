/**
 * @easyploy/config — Deep merge config with CLI overrides.
 */

import type { EasyployConfig } from "./schema.js"

export function mergeWithOverrides(
  config: EasyployConfig,
  overrides: Partial<{
    stack: string
    provider: string
    host: string
    user: string
    domain: string
    runtime: string
    proxy: string
    secrets: string
    backup: string
    dns: string
  }>
): EasyployConfig {
  const next = { ...config }
  if (overrides.stack) {
    next.stack = { ...next.stack, plugin: overrides.stack }
  }
  if (overrides.provider) {
    next.toolchain = { ...next.toolchain, provisioner: { ...next.toolchain.provisioner, plugin: overrides.provider } }
  }
  if (overrides.runtime) {
    next.toolchain = { ...next.toolchain, runtime: { ...next.toolchain.runtime, plugin: overrides.runtime } }
  }
  if (overrides.proxy) {
    next.toolchain = { ...next.toolchain, proxy: { plugin: overrides.proxy } }
  }
  if (overrides.secrets) {
    next.toolchain = { ...next.toolchain, secrets: { ...next.toolchain.secrets, plugin: overrides.secrets } }
  }
  if (overrides.backup) {
    next.toolchain = { ...next.toolchain, backup: overrides.backup === "none" ? undefined : { plugin: overrides.backup } }
  }
  if (overrides.dns) {
    next.toolchain = { ...next.toolchain, dns: overrides.dns === "manual" ? undefined : { plugin: overrides.dns } }
  }
  if (overrides.host || overrides.user || overrides.domain) {
    const provisionerConfig = (next.toolchain.provisioner.config ?? {}) as Record<string, unknown>
    if (overrides.host) provisionerConfig.host = overrides.host
    if (overrides.user) provisionerConfig.user = overrides.user
    if (overrides.domain) provisionerConfig.domain = overrides.domain
    next.toolchain = {
      ...next.toolchain,
      provisioner: { ...next.toolchain.provisioner, config: provisionerConfig },
    }
  }
  return next
}
