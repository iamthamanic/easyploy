/**
 * easyploy config — Export configuration for various platforms (Coolify, etc.)
 */

import { readFileSync, existsSync, writeFileSync } from "fs"
import { parse as parseYaml } from "yaml"
import { join } from "path"

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

export async function cmdConfig(opts: Record<string, unknown>): Promise<void> {
  const outputPath = (opts.output as string) || "coolify.yaml"
  const configPath = (opts.config as string) || "docker-compose.yml"
  
  console.log("🔧 easyploy config — Generiere Deployment-Konfiguration...\n")
  
  // Check if docker-compose.yml exists
  if (!existsSync(configPath)) {
    console.error(`❌ Fehler: ${configPath} nicht gefunden`)
    console.log("💡 Tipp: Führe 'easyploy init' zuerst aus, um ein Template zu erstellen")
    process.exit(1)
  }
  
  // Read and parse docker-compose.yml
  const composeContent = readFileSync(configPath, "utf-8")
  const compose = parseYaml(composeContent) as DockerCompose
  
  if (!compose.services || Object.keys(compose.services).length === 0) {
    console.error("❌ Fehler: Keine Services in docker-compose.yml gefunden")
    process.exit(1)
  }
  
  console.log(`📦 Gefundene Services: ${Object.keys(compose.services).join(", ")}\n`)
  
  // Convert to Coolify format
  const coolifyConfig = convertToCoolify(compose)
  
  // Generate YAML content
  const yamlContent = generateCoolifyYaml(coolifyConfig)
  
  // Write output
  writeFileSync(outputPath, yamlContent)
  
  console.log(`✅ Konfiguration exportiert nach: ${outputPath}\n`)
  console.log("📋 Nächste Schritte:")
  console.log("   1. Öffne Coolify Dashboard auf deinem Server")
  console.log("   2. Erstelle neue Resource → Import from Docker Compose")
  console.log(`   3. Lade ${outputPath} hoch oder kopiere den Inhalt`)
  console.log("   4. Konfiguriere Environment Variables in Coolify")
  console.log("   5. Deploy! 🚀\n")
  
  // Show preview
  console.log("📄 Vorschau der generierten Konfiguration:")
  console.log("─".repeat(50))
  console.log(yamlContent.substring(0, 500) + "...")
  console.log("─".repeat(50))
}

function convertToCoolify(compose: DockerCompose): CoolifyConfig {
  const services: CoolifyService[] = []
  const globalEnv: Record<string, string> = {}
  
  for (const [name, service] of Object.entries(compose.services)) {
    const coolifyService: CoolifyService = {
      name,
    }
    
    // Image or Build
    if (service.image) {
      coolifyService.image = service.image
    } else if (service.build) {
      coolifyService.build = {
        context: service.build.context || ".",
        dockerfile: service.build.dockerfile || "Dockerfile",
      }
    }
    
    // Ports
    if (service.ports && service.ports.length > 0) {
      coolifyService.ports = service.ports
    }
    
    // Environment variables
    if (service.environment) {
      coolifyService.environment = {}
      
      if (Array.isArray(service.environment)) {
        // Array format: ["KEY=value", "KEY2=value2"]
        for (const env of service.environment) {
          const [key, ...valueParts] = env.split("=")
          const value = valueParts.join("=") // Handle values with =
          
          // Check if it's a variable reference like ${VAR:-default}
          if (value.includes("${") && value.includes("}")) {
            // Replace all ${VAR:-default} occurrences in the string
            let processedValue = value
            const varRegex = /\$\{([^}]+)\}/g
            let match
            while ((match = varRegex.exec(value)) !== null) {
              const varExpr = match[1]
              const [varName, defaultValue] = varExpr.split(":-")
              const replacement = defaultValue || ""
              processedValue = processedValue.replace(match[0], replacement)
              if (varName) globalEnv[varName] = replacement
            }
            coolifyService.environment![key] = processedValue
          } else {
            coolifyService.environment![key] = value
          }
        }
      } else {
        // Object format: { KEY: "value" }
        for (const [key, value] of Object.entries(service.environment)) {
          if (typeof value === "string" && value.includes("${") && value.includes("}")) {
            // Replace all ${VAR:-default} occurrences in the string
            let processedValue = value
            const varRegex = /\$\{([^}]+)\}/g
            let match
            while ((match = varRegex.exec(value)) !== null) {
              const varExpr = match[1]
              const [varName, defaultValue] = varExpr.split(":-")
              const replacement = defaultValue || ""
              processedValue = processedValue.replace(match[0], replacement)
              if (varName) globalEnv[varName] = replacement
            }
            coolifyService.environment![key] = processedValue
          } else {
            coolifyService.environment![key] = String(value)
          }
        }
      }
    }
    
    // Volumes
    if (service.volumes && service.volumes.length > 0) {
      coolifyService.volumes = service.volumes.filter(v => !v.includes("/app/node_modules") && !v.includes("/app/.next"))
    }
    
    // Depends on
    if (service.depends_on) {
      if (Array.isArray(service.depends_on)) {
        coolifyService.depends_on = service.depends_on
      } else {
        coolifyService.depends_on = Object.keys(service.depends_on)
      }
    }
    
    // Command and Entrypoint
    if (service.command) {
      coolifyService.command = service.command
    }
    if (service.entrypoint) {
      coolifyService.entrypoint = service.entrypoint
    }
    
    // Healthcheck
    if (service.healthcheck) {
      coolifyService.healthcheck = {
        test: Array.isArray(service.healthcheck.test) 
          ? service.healthcheck.test 
          : [service.healthcheck.test],
        interval: service.healthcheck.interval,
        timeout: service.healthcheck.timeout,
        retries: service.healthcheck.retries,
      }
    }
    
    services.push(coolifyService)
  }
  
  return {
    version: "3.8",
    services,
    environment: Object.keys(globalEnv).length > 0 ? globalEnv : undefined,
  }
}

function generateCoolifyYaml(config: CoolifyConfig): string {
  let yaml = `# Coolify Konfiguration - Generiert von easyploy
# Version: ${config.version}
# Datum: ${new Date().toISOString()}

version: "${config.version}"

services:\n`
  
  for (const service of config.services) {
    yaml += `  ${service.name}:\n`
    
    if (service.image) {
      yaml += `    image: ${service.image}\n`
    } else if (service.build) {
      yaml += `    build:\n`
      yaml += `      context: ${service.build.context}\n`
      yaml += `      dockerfile: ${service.build.dockerfile}\n`
    }
    
    if (service.ports && service.ports.length > 0) {
      yaml += `    ports:\n`
      for (const port of service.ports) {
        yaml += `      - "${port}"\n`
      }
    }
    
    if (service.environment && Object.keys(service.environment).length > 0) {
      yaml += `    environment:\n`
      for (const [key, value] of Object.entries(service.environment)) {
        yaml += `      ${key}: ${value}\n`
      }
    }
    
    if (service.volumes && service.volumes.length > 0) {
      yaml += `    volumes:\n`
      for (const vol of service.volumes) {
        yaml += `      - ${vol}\n`
      }
    }
    
    if (service.depends_on && service.depends_on.length > 0) {
      yaml += `    depends_on:\n`
      for (const dep of service.depends_on) {
        yaml += `      - ${dep}\n`
      }
    }
    
    if (service.command) {
      yaml += `    command: ${service.command}\n`
    }
    
    if (service.entrypoint) {
      yaml += `    entrypoint: ${service.entrypoint}\n`
    }
    
    if (service.healthcheck) {
      yaml += `    healthcheck:\n`
      if (service.healthcheck.test) {
        yaml += `      test: [${service.healthcheck.test.map(t => `"${t}"`).join(", ")}]\n`
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
    }
    
    yaml += `\n`
  }
  
  // Add environment section if present
  if (config.environment && Object.keys(config.environment).length > 0) {
    yaml += `# Environment Variables (in Coolify konfigurieren):\n`
    yaml += `# ${Object.keys(config.environment).join(", ")}\n\n`
  }
  
  yaml += `# Hinweise:\n`
  yaml += `# - Passe die Environment Variables in Coolify an\n`
  yaml += `# - Stelle sicher, dass Volumes korrekt gemountet sind\n`
  yaml += `# - Überprüfe Port-Mappings für externen Zugriff\n`
  
  return yaml
}
