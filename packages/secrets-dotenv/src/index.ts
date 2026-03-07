/**
 * @easyploy/secrets-dotenv — Secrets: generate and render as env key=value.
 */

import type { SecretsPlugin, SecretSpec, SecretBundle, ExecutionContext } from "@easyploy/plugin-sdk"
import { randomBytes } from "node:crypto"

const meta = {
  name: "@easyploy/secrets-dotenv",
  version: "0.1.0",
  kind: "secrets" as const,
}

const capabilities = {}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex")
}

export const secretsDotenv: SecretsPlugin = {
  meta,
  capabilities,
  async validateConfig(_config: unknown): Promise<void> {},
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

export default secretsDotenv
