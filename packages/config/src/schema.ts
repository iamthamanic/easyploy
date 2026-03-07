/**
 * @easyploy/config — Zod schema for easyploy.config.
 */

import { z } from "zod"

const pluginRefSchema = z.object({
  plugin: z.string().min(1),
  version: z.string().optional(),
  config: z.record(z.unknown()).optional(),
})

export const easyployConfigSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    environment: z.enum(["dev", "staging", "prod"]),
  }),
  stack: z.object({
    plugin: z.string().min(1),
    config: z.record(z.unknown()).optional().default({}),
  }),
  toolchain: z.object({
    provisioner: pluginRefSchema,
    runtime: pluginRefSchema,
    proxy: pluginRefSchema.optional(),
    secrets: pluginRefSchema,
    backup: pluginRefSchema.optional(),
    dns: pluginRefSchema.optional(),
    monitoring: pluginRefSchema.optional(),
  }),
})

export type EasyployConfigInput = z.input<typeof easyployConfigSchema>
export type EasyployConfig = z.output<typeof easyployConfigSchema>
