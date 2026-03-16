#!/usr/bin/env node
/**
 * easyploy CLI — Entry point. Delegates to commands; no business logic here.
 */

import { createCLI, showMainMenu } from "./cli.js"
import { cmdPlan } from "./commands/plan.js"
import { cmdInit } from "./commands/init.js"
import { cmdDeploy } from "./commands/deploy.js"
import { cmdStatus } from "./commands/status.js"
import { cmdUpdate } from "./commands/update.js"
import { cmdDestroy } from "./commands/destroy.js"
import { cmdDoctor } from "./commands/doctor.js"
import { cmdAnalyze } from "./commands/analyze.js"
import { cmdTemplates, cmdInitTemplate } from "./commands/templates.js"
import { cmdConfig } from "./commands/config.js"

const argv = process.argv.slice(2)
const showMenu = argv.length === 0

async function run(): Promise<void> {
  if (showMenu) {
    await showMainMenu()
    return
  }
  const cmd = argv[0]
  const rest = argv.slice(1)
  const opts = parseOpts(rest)
  
  // Check for init --template first (before regular init)
  if (cmd === "init" && opts.template) {
    await cmdInitTemplate(opts)
    return
  }
  if (cmd === "init") {
    await cmdInit(opts)
    return
  }
  if (cmd === "plan") {
    await cmdPlan(opts)
    return
  }
  if (cmd === "deploy") {
    await cmdDeploy(opts)
    return
  }
  if (cmd === "status") {
    await cmdStatus(opts)
    return
  }
  if (cmd === "update") {
    await cmdUpdate(opts)
    return
  }
  if (cmd === "destroy") {
    await cmdDestroy(opts)
    return
  }
  if (cmd === "doctor") {
    await cmdDoctor(opts)
    return
  }
  if (cmd === "analyze") {
    await cmdAnalyze(opts)
    return
  }
  if (cmd === "templates") {
    await cmdTemplates()
    return
  }
  if (cmd === "config") {
    await cmdConfig(opts)
    return
  }
  if (cmd === "--help" || cmd === "-h" || cmd === "--version" || cmd === "-v") {
    const cli = createCLI()
    cli.parse(argv)
    return
  }
  const cli = createCLI()
    cli.parse(argv)
}

function parseOpts(args: string[]): Record<string, unknown> {
  const opts: Record<string, unknown> = {}
  const positional: string[] = []
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && args[i + 1]) {
      opts.config = args[++i]
    } else if (args[i] === "--json") {
      opts.json = true
    } else if (args[i] === "--dry-run") {
      opts.dryRun = true
    } else if (args[i] === "--non-interactive") {
      opts.nonInteractive = true
    } else if (args[i] === "--force") {
      opts.force = true
    } else if (args[i] === "--template" && args[i + 1]) {
      opts.template = args[++i]
    } else if (args[i] === "--output" && args[i + 1]) {
      opts.output = args[++i]
    } else if (args[i] === "--path" && args[i + 1]) {
      opts.path = args[++i]
    } else {
      const arg = args[i]
      if (arg && !arg.startsWith("--")) {
        positional.push(arg)
      }
    }
  }
  
  opts._ = positional
  return opts
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
