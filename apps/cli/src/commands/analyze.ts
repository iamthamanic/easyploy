import { detectStack } from "@easyploy/core";
import { writeFile } from "fs/promises";
import path from "path";

// Simple logger
const logger = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log("✅", msg),
  warn: (msg: string) => console.warn("⚠️", msg),
  error: (msg: string, err?: unknown) => console.error("❌", msg, err || ""),
};

export async function cmdAnalyze(opts: Record<string, unknown>): Promise<void> {
  const repoPath = (opts.path as string) || ".";
  const outputFile = (opts.output as string) || "easyploy.config.json";
  const dryRun = opts.dryRun as boolean;
  
  logger.info(`🔍 Analyzing repository at ${path.resolve(repoPath)}...`);
  
  try {
    const detection = await detectStack(repoPath);
    
    if (!detection.stack) {
      logger.warn("⚠️  Could not auto-detect stack.");
      logger.info("Available stacks: nhost, supabase, appwrite, pocketbase, custom");
      logger.info("\nPlease create easyploy.config.json manually or use:");
      logger.info("  easyploy init");
      return;
    }
    
    logger.success(`✅ Detected stack: ${detection.stack} (${Math.round(detection.confidence * 100)}% confidence)`);
    
    if (detection.technologies.length > 0) {
      logger.info("\nDetected technologies:");
      detection.technologies.forEach(tech => {
        logger.info(`  • ${tech.name}${tech.version ? ` @ ${tech.version}` : ""}`);
      });
    }
    
    const config = {
      project: {
        name: detection.projectName || "my-project",
        type: detection.stack,
        description: `Auto-detected ${detection.stack} project`,
      },
      workflow: {
        template: `${detection.stack}-template.json`,
        stages: ["install", "build", "test", "deploy"],
      },
      stack: {
        name: detection.stack,
        technologies: detection.technologies.map(t => t.name),
      },
      _generated: {
        at: new Date().toISOString(),
        by: "easyploy analyze",
        confidence: detection.confidence,
      },
    };
    
    if (dryRun) {
      logger.info("\n📄 Would generate config:");
      console.log(JSON.stringify(config, null, 2));
      return;
    }
    
    const outputPath = path.join(repoPath, outputFile);
    await writeFile(outputPath, JSON.stringify(config, null, 2));
    
    logger.success(`✅ Config written to ${outputPath}`);
    logger.info("\nNext steps:");
    logger.info(`  1. Review ${outputFile}`);
    logger.info("  2. Run: easyploy deploy");
    
  } catch (error) {
    logger.error("Analysis failed:", error);
    throw error;
  }
}
