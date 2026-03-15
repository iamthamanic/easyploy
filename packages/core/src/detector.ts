import path from "path";
import fs from "fs/promises";

export interface Technology {
  name: string;
  version?: string;
  category: "frontend" | "backend" | "database" | "auth" | "storage" | "build";
}

export interface StackDetectionResult {
  stack: string | null;
  confidence: number;
  technologies: Technology[];
  projectName?: string;
}

interface DetectionRule {
  stack: string;
  indicators: {
    files?: string[];
    dependencies?: string[];
    devDependencies?: string[];
    configKeys?: string[];
  };
  weight: number;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    stack: "nhost",
    indicators: {
      dependencies: ["@nhost/nhost-js", "@nhost/react"],
      files: ["nhost/config.yaml", "nhost.toml"],
    },
    weight: 1.0,
  },
  {
    stack: "supabase",
    indicators: {
      dependencies: ["@supabase/supabase-js", "@supabase/auth-helpers"],
      files: ["supabase/config.toml", ".env.local"],
    },
    weight: 1.0,
  },
  {
    stack: "appwrite",
    indicators: {
      dependencies: ["appwrite", "node-appwrite"],
      files: ["appwrite.json"],
    },
    weight: 1.0,
  },
  {
    stack: "pocketbase",
    indicators: {
      dependencies: ["pocketbase"],
      files: ["pb_data", "pocketbase"],
    },
    weight: 0.9,
  },
  {
    stack: "nextjs",
    indicators: {
      dependencies: ["next"],
      files: ["next.config.js", "next.config.ts"],
    },
    weight: 0.8,
  },
  {
    stack: "react",
    indicators: {
      dependencies: ["react", "react-dom"],
      devDependencies: ["vite", "@vitejs/plugin-react"],
    },
    weight: 0.7,
  },
  {
    stack: "vue",
    indicators: {
      dependencies: ["vue"],
      devDependencies: ["@vitejs/plugin-vue"],
    },
    weight: 0.7,
  },
  {
    stack: "svelte",
    indicators: {
      dependencies: ["svelte"],
    },
    weight: 0.7,
  },
  {
    stack: "express",
    indicators: {
      dependencies: ["express"],
    },
    weight: 0.6,
  },
  {
    stack: "fastify",
    indicators: {
      dependencies: ["fastify"],
    },
    weight: 0.6,
  },
];

export async function detectStack(repoPath: string): Promise<StackDetectionResult> {
  const technologies: Technology[] = [];
  const scores: Map<string, number> = new Map();
  
  // Read package.json
  const packageJson = await readPackageJson(repoPath);
  if (packageJson) {
    technologies.push(...extractTechnologies(packageJson));
  }
  
  // Check files and calculate scores
  for (const rule of DETECTION_RULES) {
    let score = 0;
    
    // Check dependencies
    if (rule.indicators.dependencies) {
      for (const dep of rule.indicators.dependencies) {
        if (hasDependency(packageJson, dep)) {
          score += rule.weight;
        }
      }
    }
    
    // Check devDependencies
    if (rule.indicators.devDependencies) {
      for (const dep of rule.indicators.devDependencies) {
        if (hasDevDependency(packageJson, dep)) {
          score += rule.weight * 0.8;
        }
      }
    }
    
    // Check files
    if (rule.indicators.files) {
      for (const file of rule.indicators.files) {
        if (await fileExists(path.join(repoPath, file))) {
          score += rule.weight;
        }
      }
    }
    
    if (score > 0) {
      scores.set(rule.stack, (scores.get(rule.stack) || 0) + score);
    }
  }
  
  // Find best match
  let bestStack: string | null = null;
  let bestScore = 0;
  
  for (const [stack, score] of scores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestStack = stack;
    }
  }
  
  // Calculate confidence (0-1)
  const confidence = bestScore > 0 ? Math.min(bestScore / 3, 1) : 0;
  
  return {
    stack: bestStack,
    confidence,
    technologies,
    projectName: packageJson?.name,
  };
}

async function readPackageJson(repoPath: string): Promise<any | null> {
  try {
    const content = await fs.readFile(path.join(repoPath, "package.json"), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function hasDependency(packageJson: any, name: string): boolean {
  if (!packageJson) return false;
  return !!(
    packageJson.dependencies?.[name] ||
    packageJson.peerDependencies?.[name]
  );
}

function hasDevDependency(packageJson: any, name: string): boolean {
  if (!packageJson) return false;
  return !!packageJson.devDependencies?.[name];
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function extractTechnologies(packageJson: any): Technology[] {
  const technologies: Technology[] = [];
  
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  
  const techMap: Record<string, Technology> = {
    react: { name: "React", category: "frontend" },
    vue: { name: "Vue", category: "frontend" },
    svelte: { name: "Svelte", category: "frontend" },
    next: { name: "Next.js", category: "frontend" },
    express: { name: "Express", category: "backend" },
    fastify: { name: "Fastify", category: "backend" },
    typescript: { name: "TypeScript", category: "build" },
    vite: { name: "Vite", category: "build" },
    webpack: { name: "Webpack", category: "build" },
    jest: { name: "Jest", category: "build" },
    vitest: { name: "Vitest", category: "build" },
    "@nhost/nhost-js": { name: "Nhost", category: "backend" },
    "@supabase/supabase-js": { name: "Supabase", category: "backend" },
    appwrite: { name: "Appwrite", category: "backend" },
    pocketbase: { name: "PocketBase", category: "backend" },
  };
  
  for (const [dep, info] of Object.entries(techMap)) {
    if (allDeps[dep]) {
      technologies.push({
        ...info,
        version: allDeps[dep],
      });
    }
  }
  
  return technologies;
}
