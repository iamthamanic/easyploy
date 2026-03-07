/**
 * @easyploy/proxy-caddy — Reverse proxy: Caddy with automatic TLS.
 */

import type { ReverseProxyPlugin, HostConnection, ExecutionContext } from "@easyploy/plugin-sdk"
import type { ProxyRoute } from "@easyploy/plugin-sdk"
import { sshExec } from "@easyploy/executor"

const meta = {
  name: "@easyploy/proxy-caddy",
  version: "0.1.0",
  kind: "reverse_proxy" as const,
}

const capabilities = {
  issueTls: true,
}

function caddyfile(routes: ProxyRoute[]): string {
  const blocks = routes.map((r) => {
    const upstream = r.upstream.replace("http://", "").replace("https://", "")
    if (r.tls) {
      return `${r.hostname} {\n  reverse_proxy ${upstream}\n}`
    }
    return `${r.hostname} {\n  reverse_proxy ${upstream}\n}`
  })
  return blocks.join("\n\n")
}

export const proxyCaddy: ReverseProxyPlugin = {
  meta,
  capabilities,
  async validateConfig(_config: unknown): Promise<void> {},
  async configure(
    _config: unknown,
    host: HostConnection,
    routes: ProxyRoute[],
    ctx: ExecutionContext
  ): Promise<void> {
    if (ctx.dryRun) return
    const cf = caddyfile(routes)
    const escaped = cf.replace(/'/g, "'\"'\"'")
    await sshExec(host, `mkdir -p /etc/caddy && echo '${escaped}' > /etc/caddy/Caddyfile`)
    await sshExec(host, "which caddy || (apt-get update -qq && apt-get install -y caddy)")
    await sshExec(host, "systemctl enable caddy && systemctl reload caddy || systemctl start caddy")
  },
}

export default proxyCaddy
