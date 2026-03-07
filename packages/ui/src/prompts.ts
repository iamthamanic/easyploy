/**
 * @easyploy/ui — Interactive prompts. Uses @clack/prompts.
 */

import * as p from "@clack/prompts"

export async function select<T extends string>(
  message: string,
  options: Array<{ value: T; label: string }>,
  initial?: T
): Promise<T | null> {
  const opts = options.map((o) => ({ value: o.value, label: o.label }))
  const result = await p.select({
    message,
    options: opts as never,
    initialValue: initial,
  })
  return result as T | null
}

export async function text(message: string, placeholder?: string, defaultValue?: string): Promise<string | null> {
  const result = await p.text({
    message,
    placeholder,
    defaultValue,
  })
  return typeof result === "string" ? result : null
}

export async function confirm(message: string, initial = true): Promise<boolean | null> {
  const result = await p.confirm({
    message,
    initialValue: initial,
  })
  return typeof result === "boolean" ? result : null
}

export function intro(title: string): void {
  p.intro(title)
}

export function outro(message: string): void {
  p.outro(message)
}

export function cancel(message: string): void {
  p.cancel(message)
}

export function isCancel(value: unknown): boolean {
  return p.isCancel(value)
}

export function spinner(): ReturnType<typeof p.spinner> {
  return p.spinner()
}
