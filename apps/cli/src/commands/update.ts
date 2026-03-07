/**
 * easyploy update — Re-run deploy flow (idempotent).
 */

import { cmdDeploy } from "./deploy.js"

export async function cmdUpdate(options: {
  config?: string
  nonInteractive?: boolean
}): Promise<void> {
  await cmdDeploy({
    config: options.config,
    dryRun: false,
    nonInteractive: options.nonInteractive,
  })
}
