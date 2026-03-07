/**
 * @easyploy/core — Build deployment plan from config and resolved plugins. Capability-based.
 */

import type { EasyployConfig } from "@easyploy/config"
import type { DeploymentPlan, PlanStep, ResolvedPlugins } from "./types.js"
import { PlanError } from "./errors.js"

export function createPlan(config: EasyployConfig, plugins: ResolvedPlugins): DeploymentPlan {
  const steps: PlanStep[] = []
  const caps = collectCapabilities(plugins)

  if (caps.provision) {
    steps.push({
      id: "provision",
      name: "Provision host",
      description: plugins.provisioner.meta.name,
      kind: "provision",
    })
  }
  steps.push({
    id: "install-runtime",
    name: "Install runtime",
    description: plugins.runtime.meta.name,
    kind: "install",
  })
  steps.push({
    id: "secrets",
    name: "Generate secrets",
    description: plugins.secrets.meta.name,
    kind: "secrets",
  })
  steps.push({
    id: "build",
    name: "Build stack artifact",
    description: plugins.stack.meta.name,
    kind: "build",
  })
  steps.push({
    id: "deploy",
    name: "Deploy stack",
    description: plugins.runtime.meta.name,
    kind: "deploy",
  })
  if (plugins.proxy) {
    steps.push({
      id: "proxy",
      name: "Configure reverse proxy",
      description: plugins.proxy.meta.name,
      kind: "proxy",
    })
  }
  if (plugins.dns) {
    steps.push({
      id: "dns",
      name: "Configure DNS",
      description: plugins.dns.meta.name,
      kind: "dns",
    })
  }
  if (plugins.backup) {
    steps.push({
      id: "backup",
      name: "Configure backup",
      description: plugins.backup.meta.name,
      kind: "backup",
    })
  }
  steps.push({
    id: "health",
    name: "Run health checks",
    kind: "health",
  })

  return { steps, config, plugins }
}

function collectCapabilities(plugins: ResolvedPlugins): { provision: boolean } {
  const provision =
    plugins.provisioner.capabilities["hostConnection"] === true ||
    plugins.provisioner.capabilities["createServer"] === true
  return { provision }
}

export function validatePlan(plan: DeploymentPlan): void {
  const required = plan.plugins.stack.requiredCapabilities()
  for (const cap of required) {
    let found = false
    if (plan.plugins.runtime.capabilities[cap]) found = true
    if (plan.plugins.proxy?.capabilities[cap]) found = true
    if (plan.plugins.secrets.capabilities[cap]) found = true
    if (!found && (plan.plugins.runtime.capabilities["deployCompose"] ?? false)) {
      found = true
    }
    if (!found) {
      throw new PlanError(`Stack requires capability "${cap}" but no plugin provides it`)
    }
  }
}
