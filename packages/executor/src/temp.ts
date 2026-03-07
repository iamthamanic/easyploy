/**
 * @easyploy/executor — Temporary directory creation.
 */

import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const PREFIX = "easyploy-"

export async function createTempDir(prefix = PREFIX): Promise<string> {
  const base = join(tmpdir(), prefix)
  return mkdtemp(base)
}
