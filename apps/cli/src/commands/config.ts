/**
 * easyploy config — Export configuration for various platforms (Coolify, etc.)
 * 
 * Architecture:
 * - Parser: Reads docker-compose.yml
 * - Transformer: Converts to target format (Coolify)
 * - Writer: Outputs YAML
 * 
 * SOLID Principles:
 * - SRP: Each function has one responsibility
 * - OCP: New exporters can be added without changing existing code
 * - DIP: Depends on abstractions (interfaces), not concrete implementations
 */

import { readFileSync, existsSync, writeFileSync } from "fs"
import { parse as parseYaml } from "yaml"

// ============================================================================
// Types & Interfaces (Contract)
// ============================================================================

interface DockerComposeService {
  image?: string
  build?: { context?: string; dockerfile?: string }
  ports?: string[]
  environment?: Record<string, string> | string[]
  volumes?: string[]
  depends_on?: string[] | Record<string, unknown>
  command?: string
  entrypoint?: string
  healthcheck?: {
    test?: string[] | string
    interval?: string
    timeout?: string
    retries?: number
  }
}

interface DockerCompose {
  version?: string
  services: Record<string, DockerComposeService>
  volumes?: Record<string, unknown>
  networks?: Record<string, unknown>
}

interface CoolifyService {
  name: string
  image?: string
  build?: {
    context?: string
    dockerfile?: string
  }
  ports?: string[]
  environment?: Record<string, string>
  volumes?: string[]
  depends_on?: string[]
  command?: string
  entrypoint?: string
  healthcheck?: {
    test?: string[]
    interval?: string
    timeout?: string
    retries?: number
  }
}

interface CoolifyConfig {
  version: string
  services: CoolifyService[]
  environment?: Record<string, string>
}

interface ParsedEnvVar {
  key: string
  value: string
}

// ============================================================================
// Environment Variable Parser (SRP: Only parses env vars)
// ============================================================================

class EnvironmentVariableParser {
  private readonly varRegex = /\$\{([^}]+)\}/g
  private globalEnv: Record<string, string> = {}

  /**
   * Parse a single environment variable value
   * Replaces all ${VAR:-default} patterns with their default values
   */
  parseValue(value: string): { processedValue: string; extractedVars: Record<string, string> } {
    const extractedVars: Record<string, string> = {}
    
    if (!value.includes("${") || !value.includes("}")) {
      return { processedValue: value, extractedVars }
    }

    let processedValue = value
    let match: RegExpExecArray | null

    // Reset regex state
    this.varRegex.lastIndex = 0

    while ((match = this.varRegex.exec(value)) !== null) {
      const varExpr = match[1]
      const [varName, defaultValue] = varExpr.split(":-")
      
      if (varName) {
        const replacement = defaultValue || ""
        processedValue = processedValue.replace(match[0], replacement)
        extractedVars[varName] = replacement
      }
    }

    return { processedValue, extractedVars }
  }

  /**
   * Parse environment variables from docker-compose format
   * Handles both array and object formats
   */
  parseEnvironment(
    environment: Record<string, string> | string[] | undefined
  ): { environment: Record<string, string>; globalEnv: Record<string, string> } {
    const result: Record<string, string> = {}
    const globalEnv: Record<string, string> = {}

    if (!environment) {
      return { environment: result, globalEnv }
    }

    const envVars = this.normalizeEnvironmentFormat(environment)

    for (const envStr of envVars) {
      const parsed = this.parseEnvString(envStr)
      if (parsed) {
        const { processedValue, extractedVars } = this.parseValue(parsed.value)
        result[parsed.key] = processedValue
        Object.assign(globalEnv, extractedVars)
      }
    }

    return { environment: result, globalEnv }
  }

  /**
   * Normalize environment to array of "KEY=value" strings
   */
  private normalizeEnvironmentFormat(
    environment: Record<string, string> | string[]
  ): string[] {
    if (Array.isArray(environment)) {
      return environment
    }
    return Object.entries(environment).map(([key, value]) => `${key}=${value}`)
  }

  /**
   * Parse a single "KEY=value" string
   */
  private parseEnvString(envStr: string): ParsedEnvVar | null {
    const separatorIndex = envStr.indexOf("=")
    if (separatorIndex === -1) {
      return null
    }

    const key = envStr.substring(0, separatorIndex)
    const value = envStr.substring(separatorIndex + 1)

    return { key, value }
  }
}

// ============================================================================
// Docker Compose Parser (SRP: Only reads and validates docker-compose)
// ============================================================================

class DockerComposeParser {
  parse(filePath: string): DockerCompose {
    if (!existsSync(filePath)) {
      throw new Error(`Docker Compose file not found: ${filePath}`)
    }

    const content = readFileSync(filePath, "utf-8")
    const parsed = parseYaml(content) as DockerCompose

    if (!parsed.services || Object.keys(parsed.services).length === 0) {
      throw new Error("No services found in docker-compose.yml")
    }

    return parsed
  }
}

// ============================================================================
// Coolify Transformer (SRP: Only transforms to Coolify format)
// ============================================================================

class CoolifyTransformer {
  private envParser: EnvironmentVariableParser
  private globalEnv: Record<string, string> = {}

  constructor() {
    this.envParser = new EnvironmentVariableParser()
  }

  transform(compose: DockerCompose): CoolifyConfig {
    this.globalEnv = {}
    const services = this.transformServices(compose.services)

    return {
      version: compose.version || "3.8",
      services,
      environment: Object.keys(this.globalEnv).length > 0 ? this.globalEnv : undefined,
    }
  }

  private transformServices(
    services: Record<string, DockerComposeService>
  ): CoolifyService[] {
    return Object.entries(services).map(([name, service]) =>
      this.transformService(name, service)
    )
  }

  private transformService(name: string, service: DockerComposeService): CoolifyService {
    const coolifyService: CoolifyService = { name }

    this.transformImageOrBuild(service, coolifyService)
    this.transformPorts(service, coolifyService)
    this.transformEnvironment(service, coolifyService)
    this.transformVolumes(service, coolifyService)
    this.transformDependencies(service, coolifyService)
    this.transformCommandAndEntrypoint(service, coolifyService)
    this.transformHealthcheck(service, coolifyService)

    return coolifyService
  }

  private transformImageOrBuild(
    service: DockerComposeService,
    target: CoolifyService
  ): void {
    if (service.image) {
      target.image = service.image
    } else if (service.build) {
      target.build = {
        context: service.build.context || ".",
        dockerfile: service.build.dockerfile || "Dockerfile",
      }
    }
  }

  private transformPorts(service: DockerComposeService, target: CoolifyService): void {
    if (service.ports && service.ports.length > 0) {
      target.ports = service.ports
    }
  }

  private transformEnvironment(
    service: DockerComposeService,
    target: CoolifyService
  ): void {
    if (!service.environment) {
      return
    }

    const { environment, globalEnv } = this.envParser.parseEnvironment(service.environment)
    
    if (Object.keys(environment).length > 0) {
      target.environment = environment
    }
    
    Object.assign(this.globalEnv, globalEnv)
  }

  private transformVolumes(service: DockerComposeService, target: CoolifyService): void {
    if (!service.volumes || service.volumes.length === 0) {
      return
    }

    // Filter out node_modules and build cache volumes
    target.volumes = service.volumes.filter(
      (v) => !v.includes("/app/node_modules") && !v.includes("/app/.next")
    )
  }

  private transformDependencies(
    service: DockerComposeService,
    target: CoolifyService
  ): void {
    if (!service.depends_on) {
      return
    }

    target.depends_on = Array.isArray(service.depends_on)
      ? service.depends_on
      : Object.keys(service.depends_on)
  }

  private transformCommandAndEntrypoint(
    service: DockerComposeService,
    target: CoolifyService
  ): void {
    if (service.command) {
      target.command = service.command
    }
    if (service.entrypoint) {
      target.entrypoint = service.entrypoint
    }
  }

  private transformHealthcheck(
    service: DockerComposeService,
    target: CoolifyService
  ): void {
    if (!service.healthcheck) {
      return
    }

    target.healthcheck = {
      test: Array.isArray(service.healthcheck.test)
        ? service.healthcheck.test
        : [service.healthcheck.test],
      interval: service.healthcheck.interval,
      timeout: service.healthcheck.timeout,
      retries: service.healthcheck.retries,
    }
  }
}

// ============================================================================
// Coolify YAML Writer (SRP: Only writes YAML)
// ============================================================================

class CoolifyYamlWriter {
  write(config: CoolifyConfig, filePath: string): void {
    const yaml = this.generateYaml(config)
    writeFileSync(filePath, yaml)
  }

  private generateYaml(config: CoolifyConfig): string {
    let yaml = `# Coolify Konfiguration - Generiert von easyploy
# Version: ${config.version}
# Datum: ${new Date().toISOString()}

version: "${config.version}"

services:\n`

    for (const service of config.services) {
      yaml += this.generateServiceYaml(service)
    }

    if (config.environment && Object.keys(config.environment).length > 0) {
      yaml += this.generateEnvironmentSection(config.environment)
    }

    yaml += this.generateFooter()

    return yaml
  }

  private generateServiceYaml(service: CoolifyService): string {
    let yaml = `  ${service.name}:\n`

    yaml += this.generateImageOrBuildYaml(service)
    yaml += this.generatePortsYaml(service)
    yaml += this.generateEnvironmentYaml(service)
    yaml += this.generateVolumesYaml(service)
    yaml += this.generateDependenciesYaml(service)
    yaml += this.generateCommandYaml(service)
    yaml += this.generateHealthcheckYaml(service)

    return yaml
  }

  private generateImageOrBuildYaml(service: CoolifyService): string {
    if (service.image) {
      return `    image: ${service.image}\n`
    }
    if (service.build) {
      return `    build:\n      context: ${service.build.context}\n      dockerfile: ${service.build.dockerfile}\n`
    }
    return ""
  }

  private generatePortsYaml(service: CoolifyService): string {
    if (!service.ports || service.ports.length === 0) {
      return ""
    }

    let yaml = `    ports:\n`
    for (const port of service.ports) {
      yaml += `      - "${port}"\n`
    }
    return yaml
  }

  private generateEnvironmentYaml(service: CoolifyService): string {
    if (!service.environment || Object.keys(service.environment).length === 0) {
      return ""
    }

    let yaml = `    environment:\n`
    for (const [key, value] of Object.entries(service.environment)) {
      yaml += `      ${key}: "${value}"\n`
    }
    return yaml
  }

  private generateVolumesYaml(service: CoolifyService): string {
    if (!service.volumes || service.volumes.length === 0) {
      return ""
    }

    let yaml = `    volumes:\n`
    for (const vol of service.volumes) {
      yaml += `      - ${vol}\n`
    }
    return yaml
  }

  private generateDependenciesYaml(service: CoolifyService): string {
    if (!service.depends_on || service.depends_on.length === 0) {
      return ""
    }

    let yaml = `    depends_on:\n`
    for (const dep of service.depends_on) {
      yaml += `      - ${dep}\n`
    }
    return yaml
  }

  private generateCommandYaml(service: CoolifyService): string {
    let yaml = ""
    if (service.command) {
      yaml += `    command: ${service.command}\n`
    }
    if (service.entrypoint) {
      yaml += `    entrypoint: ${service.entrypoint}\n`
    }
    return yaml
  }

  private generateHealthcheckYaml(service: CoolifyService): string {
    if (!service.healthcheck) {
      return ""
    }

    let yaml = `    healthcheck:\n`
    
    if (service.healthcheck.test) {
      const testStr = service.healthcheck.test.map((t) => `"${t}"`).join(", ")
      yaml += `      test: [${testStr}]\n`
    }
    if (service.healthcheck.interval) {
      yaml += `      interval: ${service.healthcheck.interval}\n`
    }
    if (service.healthcheck.timeout) {
      yaml += `      timeout: ${service.healthcheck.timeout}\n`
    }
    if (service.healthcheck.retries) {
      yaml += `      retries: ${service.healthcheck.retries}\n`
    }
    
    return yaml
  }

  private generateEnvironmentSection(environment: Record<string, string>): string {
    return `\n# Environment Variables (in Coolify konfigurieren):\n# ${Object.keys(environment).join(", ")}\n`
  }

  private generateFooter(): string {
    return `\n# Hinweise:\n# - Passe die Environment Variables in Coolify an\n# - Stelle sicher, dass Volumes korrekt gemountet sind\n# - Überprüfe Port-Mappings für externen Zugriff\n`
  }
}

// ============================================================================
// Config Exporter (Facade/Coordinator - orchestrates the workflow)
// ============================================================================

class ConfigExporter {
  private parser: DockerComposeParser
  private transformer: CoolifyTransformer
  private writer: CoolifyYamlWriter

  constructor() {
    this.parser = new DockerComposeParser()
    this.transformer = new CoolifyTransformer()
    this.writer = new CoolifyYamlWriter()
  }

  export(inputPath: string, outputPath: string): void {
    // Step 1: Parse
    const compose = this.parser.parse(inputPath)
    
    // Step 2: Transform
    const coolifyConfig = this.transformer.transform(compose)
    
    // Step 3: Write
    this.writer.write(coolifyConfig, outputPath)
  }
}

// ============================================================================
// CLI Command Handler
// ============================================================================

export async function cmdConfig(opts: Record<string, unknown>): Promise<void> {
  const outputPath = (opts.output as string) || "coolify.yaml"
  const configPath = (opts.config as string) || "docker-compose.yml"

  console.log("🔧 easyploy config — Generiere Deployment-Konfiguration...\n")

  try {
    const exporter = new ConfigExporter()
    exporter.export(configPath, outputPath)

    console.log(`✅ Konfiguration exportiert nach: ${outputPath}\n`)
    console.log("📋 Nächste Schritte:")
    console.log("   1. Öffne Coolify Dashboard auf deinem Server")
    console.log("   2. Erstelle neue Resource → Import from Docker Compose")
    console.log(`   3. Lade ${outputPath} hoch oder kopiere den Inhalt`)
    console.log("   4. Konfiguriere Environment Variables in Coolify")
    console.log("   5. Deploy! 🚀\n")

    // Show preview
    const preview = readFileSync(outputPath, "utf-8")
    console.log("📄 Vorschau der generierten Konfiguration:")
    console.log("─".repeat(50))
    console.log(preview.substring(0, 500) + "...")
    console.log("─".repeat(50))
  } catch (error) {
    console.error(`❌ Fehler: ${error instanceof Error ? error.message : String(error)}`)
    console.log("💡 Tipp: Führe 'easyploy init' zuerst aus, um ein Template zu erstellen")
    process.exit(1)
  }
}
