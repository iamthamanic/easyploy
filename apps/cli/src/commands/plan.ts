/**
 * easyploy plan — Load config, resolve plugins, output deployment plan.
 */

import { resolve } from "node:path"
import { loadConfig } from "@easyploy/config"
import { setPluginLoader, resolvePlugins } from "@easyploy/core"
import { plan, createExecutionContext } from "@easyploy/core"
import { formatPlan } from "@easyploy/logger"
import { createPluginLoader } from "../pluginLoader.js"

export async function cmdPlan(options: {
  config?: string
  json?: boolean
  nonInteractive?: boolean
}): Promise<void> {
  const cwd = process.cwd()
  const { config: loadedConfig } = await loadConfig(cwd, options.config)
  const loader = createPluginLoader(cwd)
  setPluginLoader(loader)

  const plugins = await resolvePlugins(loadedConfig)
  const ctx = {
    cwd,
    config: loadedConfig,
    dryRun: true,
    nonInteractive: options.nonInteractive ?? false,
  }
  const execCtx = createExecutionContext(ctx)
  const result = await plan(ctx, () => Promise.resolve(plugins))

  if (options.json) {
    console.log(JSON.stringify({ steps: result.steps, project: loadedConfig.project }, null, 2))
    return
  }
  console.log(formatPlan(result.steps))
}
