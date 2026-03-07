/**
 * @easyploy/core — Error classes. No tool-specific messages.
 */

export class EasyployError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = "EasyployError"
    Object.setPrototypeOf(this, EasyployError.prototype)
  }
}

export class ConfigError extends EasyployError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR")
    this.name = "ConfigError"
  }
}

export class ResolverError extends EasyployError {
  constructor(message: string) {
    super(message, "RESOLVER_ERROR")
    this.name = "ResolverError"
  }
}

export class ValidationError extends EasyployError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR")
    this.name = "ValidationError"
  }
}

export class PlanError extends EasyployError {
  constructor(message: string) {
    super(message, "PLAN_ERROR")
    this.name = "PlanError"
  }
}
