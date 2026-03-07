/**
 * @easyploy/executor — File read/write helpers. No business logic.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

export async function readText(path: string): Promise<string> {
  return readFile(path, "utf-8")
}

export async function writeText(path: string, content: string, mode?: number): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, { mode })
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}
