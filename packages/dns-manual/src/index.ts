/**
 * @easyploy/dns-manual — DNS: no automation. User configures records manually.
 */

import type { DnsPlugin } from "@easyploy/plugin-sdk"

const meta = {
  name: "@easyploy/dns-manual",
  version: "0.1.0",
  kind: "dns" as const,
}

const capabilities = {}

export const dnsManual: DnsPlugin = {
  meta,
  capabilities,
  async validateConfig(_config: unknown): Promise<void> {},
}

export default dnsManual
