/**
 * @easyploy/config — Default plugin refs when not specified.
 */

import type { EasyployConfig } from "./schema.js"

export const DEFAULT_PROVISIONER = "@easyploy/provider-ssh"
export const DEFAULT_RUNTIME = "@easyploy/runtime-docker-compose"
export const DEFAULT_PROXY = "@easyploy/proxy-caddy"
export const DEFAULT_SECRETS = "@easyploy/secrets-dotenv"
export const DEFAULT_BACKUP = "none"
export const DEFAULT_DNS = "manual"

export function applyDefaults(partial: Partial<EasyployConfig>): EasyployConfig {
  return {
    project: {
      name: partial.project?.name ?? "easyploy-project",
      environment: (partial.project?.environment as "dev" | "staging" | "prod") ?? "prod",
    },
    stack: {
      plugin: partial.stack?.plugin ?? "@easyploy/stack-supabase",
      config: partial.stack?.config ?? {},
    },
    toolchain: {
      provisioner: partial.toolchain?.provisioner ?? { plugin: DEFAULT_PROVISIONER },
      runtime: partial.toolchain?.runtime ?? { plugin: DEFAULT_RUNTIME },
      proxy: partial.toolchain?.proxy ?? { plugin: DEFAULT_PROXY },
      secrets: partial.toolchain?.secrets ?? { plugin: DEFAULT_SECRETS },
      backup: partial.toolchain?.backup,
      dns: partial.toolchain?.dns,
      monitoring: partial.toolchain?.monitoring,
    },
  }
}
