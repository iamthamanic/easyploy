/**
 * easyploy status — Read .easyploy/state and inventory, optionally call provider status.
 */

import { resolve } from "node:path"
import { existsSync } from "node:fs"
import { loadConfig } from "@easyploy/config"
import { setPluginLoader, resolvePlugins, EASYPLOY_DIR, STATE_FILE, INVENTORY_FILE } from "@easyploy/core"
import { readText } from "@easyploy/executor"
import { formatStatus } from "@easyploy/logger"
import { createPluginLoader } from "../pluginLoader.js"

export async function cmdStatus(options: { config?: string; json?: boolean }): Promise<void> {
  const cwd = process.cwd()
  const stateDir = resolve(cwd, EASYPLOY_DIR)
  const statePath = resolve(stateDir, STATE_FILE)
  const inventoryPath = resolve(stateDir, INVENTORY_FILE)

  const status: Record<string, unknown> = { deployed: false }

  if (existsSync(statePath)) {
    try {
      const state = JSON.parse(await readText(statePath)) as Record<string, unknown>
      status.deployed = true
      status.lastDeploy = state.lastDeploy
      status.host = state.host
    } catch {
      status.error = "Could not read state"
    }
  }
  if (existsSync(inventoryPath)) {
    try {
      const inv = JSON.parse(await readText(inventoryPath)) as Record<string, unknown>
      status.inventory = inv
    } catch {
      status.inventoryError = "Could not read inventory"
    }
  }

  if (options.json) {
    console.log(JSON.stringify(status, null, 2))
    return
  }
  console.log(formatStatus(status))
}
