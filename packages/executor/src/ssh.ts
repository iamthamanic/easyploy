/**
 * @easyploy/executor — SSH connection and remote command execution.
 */

import { exec } from "./exec.js"
import type { HostConnection } from "@easyploy/plugin-sdk"

export interface SshOptions {
  timeout?: number
}

export async function sshExec(
  host: HostConnection,
  command: string,
  options: SshOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const args = [
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "ConnectTimeout=10",
    "-p", String(host.port),
  ]
  if (host.sshKeyPath) {
    args.push("-i", host.sshKeyPath)
  }
  args.push(`${host.user}@${host.host}`, command)
  return exec("ssh", args, { timeout: options.timeout ?? 60_000 })
}

export function sshCommand(host: HostConnection, command: string): string {
  const key = host.sshKeyPath ? ` -i ${escapeArg(host.sshKeyPath)}` : ""
  return `ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -p ${host.port}${key} ${host.user}@${host.host} ${escapeArg(command)}`
}

function escapeArg(s: string): string {
  if (!s.includes(" ") && !s.includes("'") && !s.includes('"')) return s
  return `'${s.replace(/'/g, "'\"'\"'")}'`
}

export async function sshCopy(
  host: HostConnection,
  localPath: string,
  remotePath: string
): Promise<void> {
  const args = [
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "ConnectTimeout=10",
    "-P", String(host.port),
  ]
  if (host.sshKeyPath) args.push("-i", host.sshKeyPath)
  args.push(localPath, `${host.user}@${host.host}:${remotePath}`)
  const out = await exec("scp", args)
  if (out.exitCode !== 0) {
    throw new Error(`scp failed: ${out.stderr || out.stdout}`)
  }
}
