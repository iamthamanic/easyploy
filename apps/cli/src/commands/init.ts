/**
 * easyploy init — Create easyploy.config from prompts or CLI flags.
 */

import { resolve } from "node:path"
import { loadConfig, mergeWithOverrides, validateConfig } from "@easyploy/config"
import { writeText, ensureDir } from "@easyploy/executor"
import { info } from "@easyploy/logger"
import * as ui from "@easyploy/ui"
import type { EasyployConfig } from "@easyploy/config"

const STACKS = [
  { value: "@easyploy/stack-supabase", label: "Supabase" },
  { value: "appwrite", label: "Appwrite" },
  { value: "pocketbase", label: "PocketBase" },
  { value: "custom", label: "Custom Docker Stack" },
] as const

const PROVISIONERS = [
  { value: "@easyploy/provider-ssh", label: "Existing server (SSH)" },
  { value: "@easyploy/provider-hetzner", label: "Hetzner" },
  { value: "hostinger", label: "Hostinger" },
  { value: "digitalocean", label: "DigitalOcean" },
] as const

const RUNTIMES = [
  { value: "@easyploy/runtime-docker-compose", label: "Docker Compose" },
  { value: "coolify", label: "Coolify" },
  { value: "k3s", label: "K3s" },
] as const

const PROXIES = [
  { value: "@easyploy/proxy-caddy", label: "Caddy" },
  { value: "traefik", label: "Traefik" },
  { value: "nginx", label: "Nginx" },
  { value: "none", label: "None" },
] as const

const SECRETS = [
  { value: "@easyploy/secrets-dotenv", label: "Dotenv" },
  { value: "@easyploy/secrets-sops", label: "SOPS" },
] as const

const BACKUPS = [
  { value: "none", label: "None" },
  { value: "@easyploy/backup-walg", label: "WAL-G" },
  { value: "pgbackrest", label: "pgBackRest" },
  { value: "restic", label: "Restic" },
] as const

const DNS = [
  { value: "manual", label: "Manual" },
  { value: "@easyploy/dns-cloudflare", label: "Cloudflare" },
  { value: "hetzner-dns", label: "Hetzner DNS" },
] as const

export async function cmdInit(options: {
  stack?: string
  provider?: string
  runtime?: string
  proxy?: string
  secrets?: string
  backup?: string
  dns?: string
  host?: string
  user?: string
  domain?: string
  nonInteractive?: boolean
}): Promise<void> {
  const cwd = process.cwd()
  let config: EasyployConfig

  if (options.nonInteractive && options.stack && options.provider) {
    config = validateConfig({
      project: { name: "easyploy-project", environment: "prod" },
      stack: { plugin: options.stack, config: {} },
      toolchain: {
        provisioner: { plugin: options.provider, config: { host: options.host, user: options.user, domain: options.domain } },
        runtime: { plugin: options.runtime ?? "@easyploy/runtime-docker-compose" },
        proxy: options.proxy && options.proxy !== "none" ? { plugin: options.proxy } : undefined,
        secrets: { plugin: options.secrets ?? "@easyploy/secrets-dotenv" },
        backup: options.backup && options.backup !== "none" ? { plugin: options.backup } : undefined,
        dns: options.dns && options.dns !== "manual" ? { plugin: options.dns } : undefined,
      },
    })
    config = mergeWithOverrides(config, {
      stack: options.stack,
      provider: options.provider,
      host: options.host,
      user: options.user,
      domain: options.domain,
      runtime: options.runtime,
      proxy: options.proxy,
      secrets: options.secrets,
      backup: options.backup,
      dns: options.dns,
    })
  } else {
    ui.intro("easyploy init")

    const stack = await ui.select("Select stack", [...STACKS]) ?? STACKS[0].value
    const provisioner = await ui.select("Provisioner", [...PROVISIONERS]) ?? PROVISIONERS[0].value
    const runtime = await ui.select("Runtime", [...RUNTIMES]) ?? RUNTIMES[0].value
    const proxy = await ui.select("Reverse proxy", [...PROXIES]) ?? PROXIES[0].value
    const secrets = await ui.select("Secrets", [...SECRETS]) ?? SECRETS[0].value
    const backup = await ui.select("Backup", [...BACKUPS]) ?? BACKUPS[0].value
    const dns = await ui.select("DNS", [...DNS]) ?? DNS[0].value

    const host = await ui.text("SSH host (IP or hostname)", "1.2.3.4")
    const user = await ui.text("SSH user", "root")
    const domain = await ui.text("Domain", "api.example.com")
    const projectName = await ui.text("Project name", "my-app")

    if (ui.isCancel(host) || ui.isCancel(user)) {
      ui.cancel("Init cancelled.")
      return
    }

    config = validateConfig({
      project: { name: projectName ?? "my-app", environment: "prod" },
      stack: { plugin: stack, config: {} },
      toolchain: {
        provisioner: {
          plugin: provisioner,
          config: { host: host ?? "", user: user ?? "root", domain: domain ?? "", sshKeyPath: "~/.ssh/id_ed25519" },
        },
        runtime: { plugin: runtime },
        proxy: proxy !== "none" ? { plugin: proxy } : undefined,
        secrets: { plugin: secrets },
        backup: backup !== "none" ? { plugin: backup } : undefined,
        dns: dns !== "manual" ? { plugin: dns } : undefined,
      },
    })
  }

  const configPath = resolve(cwd, "easyploy.config.json")
  const content = JSON.stringify(config, null, 2)
  await ensureDir(cwd)
  await writeText(configPath, content)
  info(`Config written to ${configPath}`)
  ui.outro("Config saved. Run 'easyploy plan' then 'easyploy deploy'.")
}
