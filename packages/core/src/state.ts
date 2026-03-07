/**
 * @easyploy/core — State and inventory paths. No file I/O in core types.
 */

export const EASYPLOY_DIR = ".easyploy"
export const STATE_FILE = "state.json"
export const INVENTORY_FILE = "inventory.json"
export const LOCK_FILE = "lock.json"

export interface EasyployState {
  version: string
  lastDeploy?: string
  host?: string
  stack?: string
  [key: string]: unknown
}

export interface EasyployInventory {
  host: string
  user: string
  port: number
  domains?: string[]
  services?: string[]
  [key: string]: unknown
}

export interface EasyployLockfile {
  stack: { plugin: string; version: string }
  toolchain: Record<string, { plugin: string; version: string }>
  generatedAt: string
}
