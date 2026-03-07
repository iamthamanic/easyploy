/**
 * @easyploy/config — Load, validate, and merge easyploy configuration.
 */

import type { EasyployConfig } from "./schema.js"

export { easyployConfigSchema, type EasyployConfig, type EasyployConfigInput } from "./schema.js"
export { applyDefaults, DEFAULT_PROVISIONER, DEFAULT_RUNTIME, DEFAULT_PROXY, DEFAULT_SECRETS, DEFAULT_DNS } from "./defaults.js"
export { loadConfig, validateConfig, type LoadResult } from "./loader.js"
export { mergeWithOverrides } from "./merge.js"

export function defineConfig(config: EasyployConfig): EasyployConfig {
  return config
}
