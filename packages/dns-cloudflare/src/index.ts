/**
 * @easyploy/dns-cloudflare — DNS: create/delete records via Cloudflare API.
 */

import type { DnsPlugin, DnsRecord, ExecutionContext } from "@easyploy/plugin-sdk"

const meta = {
  name: "@easyploy/dns-cloudflare",
  version: "0.1.0",
  kind: "dns" as const,
}

const capabilities = {
  manageDns: true,
}

export const dnsCloudflare: DnsPlugin = {
  meta,
  capabilities,
  async validateConfig(config: unknown): Promise<void> {
    const c = (config ?? {}) as Record<string, unknown>
    const tokenEnv = (c.apiTokenEnv as string) ?? "CLOUDFLARE_API_TOKEN"
    if (process.env[tokenEnv] === undefined || process.env[tokenEnv] === "") {
      throw new Error(`Cloudflare token required: set ${tokenEnv}`)
    }
    if (!c.zone || typeof c.zone !== "string") {
      throw new Error("dns config must include zone (e.g. example.com)")
    }
  },
  async createRecord(
    config: unknown,
    record: DnsRecord,
    _ctx: ExecutionContext
  ): Promise<void> {
    const c = (config ?? {}) as Record<string, unknown>
    const tokenEnv = (c.apiTokenEnv as string) ?? "CLOUDFLARE_API_TOKEN"
    const token = process.env[tokenEnv]
    const zone = String(c.zone)
    if (!token) throw new Error(`Missing ${tokenEnv}`)
    const zoneId = await getZoneId(token, zone)
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.value,
        ttl: record.ttl ?? 300,
      }),
    })
  },
  async deleteRecord(
    config: unknown,
    record: DnsRecord,
    _ctx: ExecutionContext
  ): Promise<void> {
    const c = (config ?? {}) as Record<string, unknown>
    const tokenEnv = (c.apiTokenEnv as string) ?? "CLOUDFLARE_API_TOKEN"
    const token = process.env[tokenEnv]
    const zone = String(c.zone)
    if (!token) throw new Error(`Missing ${tokenEnv}`)
    const zoneId = await getZoneId(token, zone)
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(record.name)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = (await res.json()) as { result?: Array<{ id?: string }> }
    const id = data.result?.[0]?.id
    if (id) {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  },
}

async function getZoneId(token: string, zone: string): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(zone)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = (await res.json()) as { result?: Array<{ id?: string }> }
  const id = data.result?.[0]?.id
  if (!id) throw new Error(`Zone not found: ${zone}`)
  return id
}

export default dnsCloudflare
