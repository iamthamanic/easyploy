/**
 * @easyploy/provider-ssh — Provisioner: use existing server via SSH. No server creation.
 */

import type { ProvisionerPlugin, ProvisionResult, ExecutionContext } from "@easyploy/plugin-sdk"

const meta = {
  name: "@easyploy/provider-ssh",
  version: "0.1.0",
  kind: "provisioner" as const,
}

const capabilities = {
  hostConnection: true,
}

export const providerSsh: ProvisionerPlugin = {
  meta,
  capabilities,
  async validateConfig(config: unknown): Promise<void> {
    const c = (config ?? {}) as Record<string, unknown>
    if (!c.host || typeof c.host !== "string") {
      throw new Error("provider config must include host (IP or hostname)")
    }
    if (!c.user || typeof c.user !== "string") {
      throw new Error("provider config must include user (SSH user)")
    }
  },
  async provision(config: unknown, _ctx: ExecutionContext): Promise<ProvisionResult> {
    const c = (config ?? {}) as Record<string, unknown>
    const host = String(c.host)
    const user = String(c.user ?? "root")
    const port = Number(c.port ?? 22)
    const sshKeyPath = c.sshKeyPath != null ? String(c.sshKeyPath) : undefined
    return {
      host,
      user,
      port,
      sshKeyPath,
      ipv4: host,
    }
  },
}

export default providerSsh
