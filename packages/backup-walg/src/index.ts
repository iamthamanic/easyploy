/**
 * @easyploy/backup-walg — Backup: WAL-G for Postgres. Configure on host.
 */

import type { BackupPlugin, HostConnection, ExecutionContext } from "@easyploy/plugin-sdk"
import type { BackupSpec } from "@easyploy/plugin-sdk"
import { sshExec } from "@easyploy/executor"

const meta = {
  name: "@easyploy/backup-walg",
  version: "0.1.0",
  kind: "backup" as const,
}

const capabilities = {
  createBackups: true,
  restoreBackups: true,
}

export const backupWalg: BackupPlugin = {
  meta,
  capabilities,
  async validateConfig(config: unknown): Promise<void> {
    const c = (config ?? {}) as Record<string, unknown>
    if (!c.bucket || typeof c.bucket !== "string") {
      throw new Error("backup-walg config must include bucket (e.g. s3://bucket/path)")
    }
  },
  async configure(
    config: unknown,
    host: HostConnection,
    spec: BackupSpec,
    ctx: ExecutionContext
  ): Promise<void> {
    if (ctx.dryRun) return
    const c = (config ?? {}) as Record<string, unknown>
    const bucket = String(c.bucket)
    await sshExec(host, `mkdir -p /etc/wal-g`)
    await sshExec(
      host,
      `echo 'WALG_S3_PREFIX=${bucket}' > /etc/wal-g/env`
    )
  },
  async run(config: unknown, host: HostConnection, ctx: ExecutionContext): Promise<void> {
    if (ctx.dryRun) return
    await sshExec(host, "wal-g backup-push /var/lib/postgresql/data || true")
  },
}

export default backupWalg
