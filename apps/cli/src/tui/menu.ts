/**
 * easyploy TUI — Main menu. Keyboard-first.
 */

import * as ui from "@easyploy/ui"
import { cmdInit } from "../commands/init.js"
import { cmdPlan } from "../commands/plan.js"
import { cmdDeploy } from "../commands/deploy.js"
import { cmdStatus } from "../commands/status.js"
import { cmdUpdate } from "../commands/update.js"
import { cmdDoctor } from "../commands/doctor.js"

const MENU = [
  { value: "init", label: "Create new deployment config" },
  { value: "deploy", label: "Deploy current project" },
  { value: "plan", label: "Show deployment plan" },
  { value: "status", label: "Show status" },
  { value: "update", label: "Update deployment" },
  { value: "backup", label: "Backup and restore" },
  { value: "plugins", label: "Manage plugins" },
  { value: "doctor", label: "Doctor / diagnostics" },
  { value: "exit", label: "Exit" },
] as const

export async function showMainMenu(): Promise<void> {
  ui.intro("easyploy")
  const choice = await ui.select("What do you want to do?", MENU as unknown as Array<{ value: string; label: string }>)
  if (ui.isCancel(choice)) {
    ui.cancel("Bye.")
    return
  }
  switch (choice) {
    case "init":
      await cmdInit({})
      break
    case "plan":
      await cmdPlan({})
      break
    case "deploy":
      await cmdDeploy({})
      break
    case "status":
      await cmdStatus({})
      break
    case "update":
      await cmdUpdate({})
      break
    case "doctor":
      await cmdDoctor({})
      break
    case "backup":
    case "plugins":
      ui.outro("Not implemented in MVP. Use CLI: easyploy backup run / easyploy plugin list")
      break
    case "exit":
    default:
      ui.outro("Bye.")
      break
  }
}
