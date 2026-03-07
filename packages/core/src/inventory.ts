/**
 * @easyploy/core — Inventory model helpers. Actual read/write in CLI or executor.
 */

import type { EasyployInventory, EasyployLockfile, EasyployState } from "./state.js"
import type { ProvisionResult } from "@easyploy/plugin-sdk"

export function stateFromProvision(result: ProvisionResult): Partial<EasyployState> {
  return {
    host: result.host,
    lastDeploy: new Date().toISOString(),
  }
}

export function inventoryFromProvision(result: ProvisionResult): EasyployInventory {
  return {
    host: result.host,
    user: result.user,
    port: result.port,
    sshKeyPath: result.sshKeyPath,
    ipv4: result.ipv4,
    ipv6: result.ipv6,
  }
}

export function createLockfile(
  stack: { plugin: string; version: string },
  toolchain: Record<string, { plugin: string; version: string }>
): EasyployLockfile {
  return {
    stack,
    toolchain,
    generatedAt: new Date().toISOString(),
  }
}
