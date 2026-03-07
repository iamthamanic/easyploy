/**
 * easyploy CLI — Command definitions. Uses cac; delegates logic to commands.
 */

import { cac } from "cac"
import { cmdInit } from "./commands/init.js"
import { cmdPlan } from "./commands/plan.js"
import { cmdDeploy } from "./commands/deploy.js"
import { cmdStatus } from "./commands/status.js"
import { cmdUpdate } from "./commands/update.js"
import { cmdDestroy } from "./commands/destroy.js"
import { cmdDoctor } from "./commands/doctor.js"
import { showMainMenu } from "./tui/menu.js"

const pkg = { name: "easyploy", version: "0.1.0" }

export function createCLI() {
  const cli = cac(pkg.name)

  cli.version(pkg.version)
  cli.help()

  cli
    .command("init", "Create new deployment config")
    .option("--stack <name>", "Stack plugin")
    .option("--provider <name>", "Provisioner plugin")
    .option("--runtime <name>", "Runtime plugin")
    .option("--proxy <name>", "Reverse proxy plugin")
    .option("--secrets <name>", "Secrets plugin")
    .option("--backup <name>", "Backup plugin")
    .option("--dns <name>", "DNS plugin")
    .option("--host <host>", "SSH host")
    .option("--user <user>", "SSH user")
    .option("--domain <domain>", "Domain")
    .option("--non-interactive", "Skip prompts")
    .action((opts) => cmdInit(opts).catch((e) => { console.error(e); process.exit(1) }))

  cli
    .command("plan", "Show deployment plan")
    .option("--config <path>", "Config file path")
    .option("--json", "Output as JSON")
    .option("--non-interactive", "No prompts")
    .action((opts) => cmdPlan(opts).catch((e) => { console.error(e); process.exit(1) }))

  cli
    .command("deploy", "Deploy current project")
    .option("--config <path>", "Config file path")
    .option("--dry-run", "Only plan, do not apply")
    .option("--non-interactive", "No prompts")
    .action((opts) => cmdDeploy(opts).catch((e) => { console.error(e); process.exit(1) }))

  cli
    .command("status", "Show deployment status")
    .option("--config <path>", "Config file path")
    .option("--json", "Output as JSON")
    .action((opts) => cmdStatus(opts).catch((e) => { console.error(e); process.exit(1) }))

  cli
    .command("update", "Update deployment")
    .option("--config <path>", "Config file path")
    .option("--non-interactive", "No prompts")
    .action((opts) => cmdUpdate(opts).catch((e) => { console.error(e); process.exit(1) }))

  cli
    .command("destroy", "Tear down deployment")
    .option("--config <path>", "Config file path")
    .option("--force", "Skip confirmation")
    .action((opts) => cmdDestroy(opts).catch((e) => { console.error(e); process.exit(1) }))

  cli
    .command("doctor", "Run diagnostics")
    .option("--config <path>", "Config file path")
    .action((opts) => cmdDoctor(opts).catch((e) => { console.error(e); process.exit(1) }))

  return cli
}

export { showMainMenu }
