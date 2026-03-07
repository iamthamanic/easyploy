/**
 * easyploy deploy — Plan then apply: provision (optional), install runtime, secrets, build, deploy, proxy, backup.
 */

import { resolve, dirname } from "node:path"
import { loadConfig } from "@easyploy/config"
import {
  setPluginLoader,
  resolvePlugins,
  plan,
  createExecutionContext,
  provision,
  buildStack,
  hostFromProvision,
  EASYPLOY_DIR,
  STATE_FILE,
  INVENTORY_FILE,
  LOCK_FILE,
  stateFromProvision,
  inventoryFromProvision,
  createLockfile,
} from "@easyploy/core"
import { ensureDir, writeText } from "@easyploy/executor"
import { info } from "@easyploy/logger"
import { createPluginLoader } from "../pluginLoader.js"

export async function cmdDeploy(options: {
  config?: string
  dryRun?: boolean
  nonInteractive?: boolean
}): Promise<void> {
  const cwd = process.cwd()
  const { config: loadedConfig, path: configPath } = await loadConfig(cwd, options.config)
  const configDir = dirname(configPath)
  setPluginLoader(createPluginLoader(configDir))

  const plugins = await resolvePlugins(loadedConfig)
  const ctx = {
    cwd: configDir,
    config: loadedConfig,
    dryRun: options.dryRun ?? false,
    nonInteractive: options.nonInteractive ?? false,
  }
  const execCtx = createExecutionContext(ctx)

  const planResult = await plan(ctx, () => Promise.resolve(plugins))
  info("Deployment plan", { stepCount: planResult.steps.length })

  if (options.dryRun) {
    info("Dry run — no changes applied.")
    return
  }

  const provisionResult = await provision(plugins, loadedConfig, execCtx)
  const host = hostFromProvision(provisionResult)

  await plugins.runtime.install(
    loadedConfig.toolchain.runtime.config ?? {},
    host,
    execCtx
  )

  const artifact = await buildStack(plugins, loadedConfig, execCtx)
  await plugins.runtime.deploy(
    loadedConfig.toolchain.runtime.config ?? {},
    artifact,
    host,
    execCtx
  )

  if (plugins.proxy?.configure) {
    await plugins.proxy.configure(
      loadedConfig.toolchain.proxy?.config ?? {},
      host,
      [{ hostname: (loadedConfig.toolchain.provisioner.config as Record<string, string>)?.domain ?? "localhost", upstream: "http://127.0.0.1:8000", tls: true }],
      execCtx
    )
  }

  const stateDir = resolve(configDir, EASYPLOY_DIR)
  await ensureDir(stateDir)
  await writeText(
    resolve(stateDir, STATE_FILE),
    JSON.stringify(stateFromProvision(provisionResult), null, 2)
  )
  await writeText(
    resolve(stateDir, INVENTORY_FILE),
    JSON.stringify(inventoryFromProvision(provisionResult), null, 2)
  )
  await writeText(
    resolve(stateDir, LOCK_FILE),
    JSON.stringify(
      createLockfile(
        { plugin: loadedConfig.stack.plugin, version: "0.1.0" },
        {
          provisioner: { plugin: loadedConfig.toolchain.provisioner.plugin, version: "0.1.0" },
          runtime: { plugin: loadedConfig.toolchain.runtime.plugin, version: "0.1.0" },
          secrets: { plugin: loadedConfig.toolchain.secrets.plugin, version: "0.1.0" },
        }
      ),
      null,
      2
    )
  )

  info("Deploy complete.", { host: host.host })
}
