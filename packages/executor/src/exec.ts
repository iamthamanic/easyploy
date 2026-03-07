/**
 * @easyploy/executor — Run local shell commands. No business logic.
 */

import { execa } from "execa"

export interface ExecOptions {
  cwd?: string
  env?: Record<string, string>
  timeout?: number
}

export async function exec(
  command: string,
  args: string[],
  options: ExecOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { cwd, env, timeout } = options
  try {
    const result = await execa(command, args, {
      cwd,
      env: env ? { ...process.env, ...env } : undefined,
      timeout: timeout ?? 60_000,
      all: true,
    })
    return {
      stdout: result.all ?? result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.exitCode ?? 0,
    }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; exitCode?: number; message?: string }
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? e.message ?? String(err),
      exitCode: e.exitCode ?? 1,
    }
  }
}

export async function execSafe(
  command: string,
  args: string[],
  options: ExecOptions = {}
): Promise<string> {
  const out = await exec(command, args, options)
  if (out.exitCode !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${out.stderr || out.stdout}`)
  }
  return out.stdout
}
