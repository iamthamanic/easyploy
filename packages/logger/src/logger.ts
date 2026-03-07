/**
 * @easyploy/logger — Structured logging. No secrets in output.
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

const SENSITIVE_KEYS = [
  "password",
  "secret",
  "token",
  "key",
  "authorization",
  "cookie",
  "apiKey",
  "api_key",
]

function mask(value: unknown): string {
  if (value === null || value === undefined) return ""
  const s = String(value)
  if (s.length <= 4) return "****"
  return s.slice(0, 2) + "****" + s.slice(-2)
}

function redact(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj
  if (Array.isArray(obj)) return obj.map(redact)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase()
    if (SENSITIVE_KEYS.some((sk) => lower.includes(sk))) {
      out[k] = mask(v)
    } else {
      out[k] = redact(v)
    }
  }
  return out
}

let level: LogLevel = "info"

export function setLevel(l: LogLevel): void {
  level = l
}

export function getLevel(): LogLevel {
  return level
}

const ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(l: LogLevel): boolean {
  return ORDER[l] >= ORDER[level]
}

export function debug(msg: string, data?: Record<string, unknown>): void {
  if (!shouldLog("debug")) return
  const payload = data ? redact(data) : undefined
  console.debug("[easyploy] [debug]", msg, payload ?? "")
}

export function info(msg: string, data?: Record<string, unknown>): void {
  if (!shouldLog("info")) return
  const payload = data ? redact(data) : undefined
  console.info("[easyploy]", msg, payload ?? "")
}

export function warn(msg: string, data?: Record<string, unknown>): void {
  if (!shouldLog("warn")) return
  const payload = data ? redact(data) : undefined
  console.warn("[easyploy] [warn]", msg, payload ?? "")
}

export function error(msg: string, err?: unknown, data?: Record<string, unknown>): void {
  if (!shouldLog("error")) return
  const payload = data ? redact(data) : undefined
  const errMsg = err instanceof Error ? err.message : err != null ? String(err) : undefined
  console.error("[easyploy] [error]", msg, errMsg ?? "", payload ?? "")
}
