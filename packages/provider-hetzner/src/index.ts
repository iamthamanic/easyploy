/**
 * @easyploy/provider-hetzner — Provisioner: create server via Hetzner Cloud API.
 */

import type { ProvisionerPlugin, ProvisionResult, ExecutionContext } from "@easyploy/plugin-sdk"

const meta = {
  name: "@easyploy/provider-hetzner",
  version: "0.1.0",
  kind: "provisioner" as const,
}

const capabilities = {
  createServer: true,
  hostConnection: true,
}

export const providerHetzner: ProvisionerPlugin = {
  meta,
  capabilities,
  async validateConfig(config: unknown): Promise<void> {
    const c = (config ?? {}) as Record<string, unknown>
    const tokenEnv = (c.apiTokenEnv as string) ?? "HCLOUD_TOKEN"
    if (process.env[tokenEnv] === undefined || process.env[tokenEnv] === "") {
      throw new Error(`Hetzner API token required: set ${tokenEnv}`)
    }
    if (!c.region || typeof c.region !== "string") {
      throw new Error("provider config must include region (e.g. fsn1)")
    }
    if (!c.serverType || typeof c.serverType !== "string") {
      throw new Error("provider config must include serverType (e.g. cx22)")
    }
  },
  async provision(config: unknown, _ctx: ExecutionContext): Promise<ProvisionResult> {
    const c = (config ?? {}) as Record<string, unknown>
    const tokenEnv = (c.apiTokenEnv as string) ?? "HCLOUD_TOKEN"
    const token = process.env[tokenEnv]
    if (!token) {
      throw new Error(`Missing ${tokenEnv}`)
    }
    const region = String(c.region ?? "fsn1")
    const serverType = String(c.serverType ?? "cx22")
    const image = String(c.image ?? "ubuntu-24.04")
    const sshKeyPath = c.sshKeyPath != null ? String(c.sshKeyPath) : undefined

    const res = await fetch("https://api.hetzner.cloud/v1/servers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `easyploy-${Date.now()}`,
        server_type: serverType,
        image,
        location: region,
        ssh_keys: [],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Hetzner API error: ${res.status} ${text}`)
    }
    const data = (await res.json()) as { server?: { public_net?: { ipv4?: { ip?: string } }; root_password?: string } }
    const server = data.server
    if (!server?.public_net?.ipv4?.ip) {
      throw new Error("Hetzner did not return server IP")
    }
    const host = server.public_net.ipv4.ip
    return {
      host,
      user: "root",
      port: 22,
      sshKeyPath,
      ipv4: host,
      metadata: { serverId: (data as { server?: { id?: number } }).server?.id },
    }
  },
  async status(config: unknown, _ctx: ExecutionContext): Promise<Record<string, unknown>> {
    await this.validateConfig(config)
    return { provider: "hetzner", note: "Check Hetzner Cloud Console for server status" }
  },
}

export default providerHetzner
