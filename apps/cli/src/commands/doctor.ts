/**
 * easyploy doctor — Diagnose config, plugins, and environment.
 */

import { resolve } from "node:path"
import { existsSync } from "node:fs"
import { loadConfig } from "@easyploy/config"
import { setPluginLoader, resolvePlugins } from "@easyploy/core"
import { exec } from "@easyploy/executor"
import { info } from "@easyploy/logger"
import { createPluginLoader } from "../pluginLoader.js"

export async function cmdDoctor(options: { config?: string }): Promise<void> {
  const cwd = process.cwd()
  const checks: Array<{ name: string; ok: boolean; message?: string }> = []

  const configPath = options.config ? resolve(cwd, options.config) : resolve(cwd, "easyploy.config.json")
  if (existsSync(configPath)) {
    try {
      const { config, path } = await loadConfig(cwd, options.config)
      checks.push({ name: "config", ok: true, message: path })
      const configDir = path.split("/").slice(0, -1).join("/") || "."
      setPluginLoader(createPluginLoader(configDir))
      const plugins = await resolvePlugins(config)
      checks.push({
        name: "plugins",
        ok: true,
        message: `stack=${plugins.stack.meta.name} provisioner=${plugins.provisioner.meta.name}`,
      })
    } catch (e) {
      checks.push({ name: "config", ok: false, message: e instanceof Error ? e.message : String(e) })
    }
  } else {
    checks.push({ name: "config", ok: false, message: "No config file found" })
  }

  const sshOut = await exec("ssh", ["-V"])
  checks.push({ name: "ssh", ok: sshOut.exitCode === 0 })

  const dockerOut = await exec("docker", ["--version"])
  checks.push({ name: "docker", ok: dockerOut.exitCode === 0 })

  for (const c of checks) {
    info(c.ok ? "ok" : "fail", { [c.name]: c.message ?? c.ok })
  }
  console.log("Doctor checks:", checks.map((c) => `${c.name}: ${c.ok ? "ok" : "fail"}`).join(", "))
}
