/**
 * @easyploy/secrets-sops — Secrets: SOPS-compatible placeholder. Full SOPS requires CLI.
 */

import type { SecretsPlugin, SecretSpec, SecretBundle, ExecutionContext } from "@easyploy/plugin-sdk"
import { randomBytes } from "node:crypto"

const meta = {
  name: "@easyploy/secrets-sops",
  version: "0.1.0",
  kind: "secrets" as const,
}

const capabilities = {}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex")
}

export const secretsSops: SecretsPlugin = {
  meta,
  capabilities,
  async validateConfig(config: unknown): Promise<void> {
    const c = (config ?? {}) as Record<string, unknown>
    if (c.ageKeyFile !== undefined && typeof c.ageKeyFile !== "string") {
      throw new Error("secrets-sops config.ageKeyFile must be a string")
    }
  },
  async generate(
    _config: unknown,
    spec: SecretSpec[],
    _ctx: ExecutionContext
  ): Promise<SecretBundle> {
    const secrets: Record<string, string> = {}
    for (const s of spec) {
      if (s.type === "random") {
        secrets[s.name] = randomHex(Math.ceil((s.length ?? 32) / 2))
      } else if (s.type === "env" && s.envKey) {
        const v = process.env[s.envKey]
        if (v) secrets[s.name] = v
      }
    }
    return { secrets }
  },
  async renderEnv(
    _config: unknown,
    bundle: SecretBundle,
    _ctx: ExecutionContext
  ): Promise<Record<string, string>> {
    return { ...bundle.secrets }
  },
}

export default secretsSops
