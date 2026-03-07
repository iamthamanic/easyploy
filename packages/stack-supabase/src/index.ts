/**
 * @easyploy/stack-supabase — Stack plugin: Supabase self-hosted.
 */

import type { StackPlugin, DeployArtifact, ExecutionContext, HealthCheckDefinition } from "@easyploy/plugin-sdk"
import { renderCompose } from "./templates/compose.js"
import { renderKongYml } from "./templates/kong.js"

const meta = {
  name: "@easyploy/stack-supabase",
  version: "0.1.0",
  kind: "stack" as const,
}

const capabilities = {
  deployCompose: true,
}

export const stackSupabase: StackPlugin = {
  meta,
  capabilities,
  async validateConfig(config: unknown): Promise<void> {
    if (config !== null && typeof config === "object") {
      const c = config as Record<string, unknown>
      if (c.projectUrl !== undefined && typeof c.projectUrl !== "string") {
        throw new Error("stack.config.projectUrl must be a string")
      }
    }
  },
  requiredCapabilities(): string[] {
    return ["deployCompose"]
  },
  async build(config: unknown, ctx: ExecutionContext): Promise<DeployArtifact> {
    const c = (config ?? {}) as Record<string, unknown>
    const projectUrl = (c.projectUrl as string) ?? "http://127.0.0.1:8000"
    const env: Record<string, string> = {
      PROJECT_URL: projectUrl,
      ANON_KEY: "placeholder-will-be-replaced-by-secrets",
      SERVICE_ROLE_KEY: "placeholder-will-be-replaced-by-secrets",
      JWT_SECRET: "placeholder-will-be-replaced-by-secrets",
      POSTGRES_PASSWORD: "postgres",
    }
    const compose = renderCompose(env)
    const kong = renderKongYml()
    return {
      kind: "docker-compose",
      files: [
        { path: "docker-compose.yml", content: compose },
        { path: "kong.yml", content: kong },
      ],
      env,
      metadata: { stack: "supabase" },
    }
  },
  healthChecks(_config: unknown): HealthCheckDefinition[] {
    return [
      { name: "kong", type: "http", target: "http://127.0.0.1:8000/rest/v1/", intervalSeconds: 10, timeoutSeconds: 5 },
    ]
  },
}

export default stackSupabase
