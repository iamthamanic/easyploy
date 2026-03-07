/**
 * @easyploy/core — Config and capability validation.
 */

import type { ResolvedPlugins } from "./types.js"
import type { EasyployConfig } from "@easyploy/config"
import { ValidationError } from "./errors.js"

export async function validateConfigWithPlugins(
  config: EasyployConfig,
  plugins: ResolvedPlugins
): Promise<void> {
  await plugins.stack.validateConfig(config.stack.config ?? {})
  await plugins.provisioner.validateConfig(config.toolchain.provisioner.config ?? {})
  await plugins.runtime.validateConfig(config.toolchain.runtime.config ?? {})
  await plugins.secrets.validateConfig(config.toolchain.secrets.config ?? {})
  if (plugins.proxy) {
    await plugins.proxy.validateConfig(config.toolchain.proxy?.config ?? {})
  }
  if (plugins.backup) {
    await plugins.backup.validateConfig(config.toolchain.backup?.config ?? {})
  }
  if (plugins.dns) {
    await plugins.dns.validateConfig(config.toolchain.dns?.config ?? {})
  }
}

export function requireProvisionerConfig(config: EasyployConfig): void {
  const prov = config.toolchain.provisioner
  const pluginName = prov.plugin
  if (pluginName.includes("ssh") || pluginName.includes("existing")) {
    const c = (prov.config ?? {}) as Record<string, unknown>
    if (!c.host || typeof c.host !== "string") {
      throw new ValidationError("Provisioner config must include 'host' for SSH/existing server")
    }
    if (!c.user || typeof c.user !== "string") {
      throw new ValidationError("Provisioner config must include 'user' for SSH/existing server")
    }
  }
}
