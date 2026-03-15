import { getAvailableTemplates, getTemplate, Template } from "@easyploy/core";
import { select, text, confirm, intro, outro } from "@easyploy/ui";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function cmdTemplates(): Promise<void> {
  intro("📦 easyploy Templates");
  
  const templates = getAvailableTemplates();
  
  console.log("\nVerfügbare Templates:\n");
  
  for (const template of templates) {
    console.log(`  ${template.name}`);
    console.log(`    ${template.description}`);
    console.log(`    Technologien: ${template.technologies.join(", ")}`);
    console.log();
  }
  
  console.log("Verwendung:");
  console.log("  easyploy init --template <name> [projekt-name]");
  console.log();
  console.log("Beispiel:");
  console.log("  easyploy init --template nhost mein-app");
  
  outro("Fertig!");
}

export async function cmdInitTemplate(opts: Record<string, unknown>): Promise<void> {
  const templateName = opts.template as string;
  const projectName = (opts.project as string) || (opts._ as string[])?.[0];
  
  if (!templateName) {
    console.error("❌ Fehler: --template ist erforderlich");
    console.log("Verfügbare Templates:");
    await cmdTemplates();
    process.exit(1);
  }
  
  if (!projectName) {
    console.error("❌ Fehler: Projektname fehlt");
    console.log("Verwendung: easyploy init --template <name> <projekt-name>");
    process.exit(1);
  }
  
  intro(`🚀 Initialisiere ${templateName} Projekt: ${projectName}`);
  
  const templates = getAvailableTemplates();
  const template = templates.find(t => t.name === templateName);
  
  if (!template) {
    console.error(`❌ Template '${templateName}' nicht gefunden`);
    console.log("Verfügbare Templates:");
    templates.forEach(t => console.log(`  - ${t.name}`));
    process.exit(1);
  }
  
  // Erstelle Projekt-Verzeichnis
  const projectPath = path.resolve(projectName);
  
  try {
    await mkdir(projectPath, { recursive: true });
    console.log(`📁 Verzeichnis erstellt: ${projectPath}`);
  } catch (error) {
    console.error(`❌ Konnte Verzeichnis nicht erstellen: ${error}`);
    process.exit(1);
  }
  
  // Erstelle Boilerplate-Dateien
  console.log("📝 Erstelle Boilerplate-Dateien...");
  
  for (const file of template.files) {
    const filePath = path.join(projectPath, file.path);
    const dir = path.dirname(filePath);
    
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, file.content);
    console.log(`  ✓ ${file.path}`);
  }
  
  // Erstelle easyploy.config.json
  const config = {
    project: {
      name: projectName,
      type: template.name,
      description: `${template.name} project created from template`,
    },
    workflow: {
      template: `${template.name}-template.json`,
      stages: ["install", "build", "test", "deploy"],
    },
    stack: {
      name: template.name,
      technologies: template.technologies,
    },
    _generated: {
      at: new Date().toISOString(),
      by: "easyploy init --template",
      template: template.name,
    },
  };
  
  await writeFile(
    path.join(projectPath, "easyploy.config.json"),
    JSON.stringify(config, null, 2)
  );
  console.log("  ✓ easyploy.config.json");
  
  outro(`✅ Projekt '${projectName}' erstellt!`);
  
  console.log("\nNächste Schritte:");
  console.log(`  cd ${projectName}`);
  console.log("  easyploy deploy");
}
