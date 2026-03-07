/**
 * @easyploy/runtime-docker-compose — Runtime: deploy via Docker Compose on host.
 */

import type { RuntimePlugin, HostConnection, DeployArtifact, ExecutionContext } from "@easyploy/plugin-sdk"
import { sshExec, sshCopy, createTempDir, writeText, exec } from "@easyploy/executor"
import { join } from "node:path"

const meta = {
  name: "@easyploy/runtime-docker-compose",
  version: "0.1.0",
  kind: "runtime" as const,
}

const capabilities = {
  deployCompose: true,
}

export const runtimeDockerCompose: RuntimePlugin = {
  meta,
  capabilities,
  async validateConfig(_config: unknown): Promise<void> {
    // no required config
  },
  async install(_config: unknown, host: HostConnection, ctx: ExecutionContext): Promise<void> {
    if (ctx.dryRun) return
    const out = await sshExec(host, "which docker")
    if (out.exitCode === 0) return
    await sshExec(host, "curl -fsSL https://get.docker.com | sh")
    const again = await sshExec(host, "which docker-compose || which docker")
    if (again.exitCode !== 0) {
      throw new Error("Docker installation failed on host")
    }
  },
  async deploy(
    _config: unknown,
    artifact: DeployArtifact,
    host: HostConnection,
    ctx: ExecutionContext
  ): Promise<void> {
    if (ctx.dryRun) return
    const dir = await createTempDir()
    const remoteDir = "/opt/easyploy"
    for (const f of artifact.files) {
      const localPath = join(dir, f.path)
      await writeText(localPath, f.content, f.mode)
    }
    await sshExec(host, `mkdir -p ${remoteDir}`)
    for (const f of artifact.files) {
      const localPath = join(dir, f.path)
      await sshCopy(host, localPath, `${remoteDir}/${f.path}`)
    }
    const envLine =
      Object.entries(artifact.env ?? {})
        .map(([k, v]) => `${k}=${String(v).replace(/"/g, '\\"')}`)
        .join(" ") || ""
    await sshExec(host, `cd ${remoteDir} && ${envLine} docker compose -f docker-compose.yml up -d`)
  },
}

export default runtimeDockerCompose
