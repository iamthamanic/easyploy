/**
 * easyploy CLI — Load plugins by package name (workspace or node_modules). No tool logic.
 */

import type { PluginRef } from "@easyploy/plugin-sdk"

export function createPluginLoader(_cwd: string) {
  return async function load(ref: PluginRef): Promise<unknown> {
    const name = ref.plugin
    try {
      const mod = await import(name)
      return mod.default ?? mod
    } catch (e) {
      throw new Error(`Cannot load plugin ${name}. Install it or check name. ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}
