/**
 * easyploy destroy — Tear down deployment. Optional provider.destroy.
 */

import { resolve, dirname } from "node:path"
import { loadConfig } from "@easyploy/config"
import { setPluginLoader, resolvePlugins, createExecutionContext, EASYPLOY_DIR } from "@easyploy/core"
import { rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { info } from "@easyploy/logger"
import * as ui from "@easyploy/ui"
import { createPluginLoader } from "../pluginLoader.js"

export async function cmdDestroy(options: { config?: string; force?: boolean }): Promise<void> {
  const cwd = process.cwd()
  if (!options.force) {
    const ok = await ui.confirm("Remove deployment state and tear down? This may destroy the server.", false)
    if (!ok) {
      ui.outro("Cancelled.")
      return
    }
  }

  const { config: loadedConfig, path: configPath } = await loadConfig(cwd, options.config)
  const configDir = dirname(configPath)
  setPluginLoader(createPluginLoader(configDir))
  const plugins = await resolvePlugins(loadedConfig)
  const execCtx = createExecutionContext({
    cwd: configDir,
    config: loadedConfig,
    dryRun: false,
    nonInteractive: options.force ?? false,
  })

  if (plugins.provisioner.destroy) {
    await plugins.provisioner.destroy(
      loadedConfig.toolchain.provisioner.config ?? {},
      execCtx
    )
  }

  const stateDir = resolve(configDir, EASYPLOY_DIR)
  if (existsSync(stateDir)) {
    await rm(stateDir, { recursive: true })
    info("Removed .easyploy directory.")
  }
  ui.outro("Destroy complete.")
}
