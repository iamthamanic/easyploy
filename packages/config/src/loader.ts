/**
 * @easyploy/config — Load and validate easyploy.config from file or object.
 */

import { readFile } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { easyployConfigSchema, type EasyployConfig } from "./schema.js"
import { applyDefaults } from "./defaults.js"

const CONFIG_FILES = ["easyploy.config.json", "easyploy.config.js", "easyploy.config.mjs"]

export interface LoadResult {
  config: EasyployConfig
  path: string
  cwd: string
}

export async function loadConfig(cwd: string, explicitPath?: string): Promise<LoadResult> {
  const path = explicitPath
    ? resolve(cwd, explicitPath)
    : await findConfigFile(cwd)

  if (!path) {
    throw new Error(
      `No easyploy config found. Create one of: ${CONFIG_FILES.join(", ")} or pass --config`
    )
  }

  const raw = await loadRawConfig(path)
  const parsed = easyployConfigSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
    throw new Error(`Invalid config at ${path}: ${msg}`)
  }

  const config = applyDefaults(parsed.data)
  return {
    config,
    path,
    cwd: dirname(path),
  }
}

async function findConfigFile(cwd: string): Promise<string | null> {
  for (const name of CONFIG_FILES) {
    const p = resolve(cwd, name)
    try {
      await readFile(p, "utf-8")
      return p
    } catch {
      continue
    }
  }
  return null
}

async function loadRawConfig(path: string): Promise<unknown> {
  const ext = path.replace(/^.*\./, "")
  if (ext === "json") {
    const content = await readFile(path, "utf-8")
    return JSON.parse(content) as unknown
  }
  if (ext === "ts" || ext === "js" || ext === "mjs") {
    const mod = await import(path)
    const def = mod.default ?? mod
    if (typeof def === "function") return def()
    return def
  }
  throw new Error(`Unsupported config extension: ${ext}`)
}

export function validateConfig(config: unknown): EasyployConfig {
  const parsed = easyployConfigSchema.safeParse(config)
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
    throw new Error(`Invalid config: ${msg}`)
  }
  return applyDefaults(parsed.data)
}
