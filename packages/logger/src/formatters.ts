/**
 * @easyploy/logger — Human-readable output formatters.
 */

export function formatPlan(steps: Array<{ name: string; description?: string }>): string {
  const lines = steps.map((s, i) => `  ${i + 1}. ${s.name}${s.description ? ` — ${s.description}` : ""}`)
  return ["Deployment plan:", ...lines].join("\n")
}

export function formatStatus(status: Record<string, unknown>): string {
  const lines = Object.entries(status).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
  return ["Status:", ...lines].join("\n")
}
