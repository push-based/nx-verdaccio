import type { ProjectConfiguration } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

export async function loadMergedProjectConfig(
  projectRoot: string,
  workspaceRoot?: string
): Promise<ProjectConfiguration> {
  const baseConfig: ProjectConfiguration = {
    name: '',
    root: projectRoot,
  };

  if (!projectRoot) {
    return baseConfig;
  }

  const baseDir = workspaceRoot || process.cwd();
  const [packageJson, projectJson] = await Promise.all([
    readJson<Record<string, unknown>>(
      join(baseDir, projectRoot, 'package.json')
    ),
    readJson<ProjectConfiguration>(join(baseDir, projectRoot, 'project.json')),
  ]);

  const packageConfig: Partial<ProjectConfiguration> =
    (packageJson?.nx as ProjectConfiguration) || {};
  const packageName = packageJson?.name as string | undefined;

  if (!packageJson && !projectJson) {
    return baseConfig;
  }

  const merged: ProjectConfiguration = {
    ...baseConfig,
    ...packageConfig,
    ...projectJson,
  };

  if (packageConfig.targets || projectJson?.targets) {
    merged.targets = {};

    if (packageConfig.targets) {
      Object.assign(merged.targets, packageConfig.targets);
    }

    if (projectJson?.targets) {
      for (const [targetName, projectTarget] of Object.entries(
        projectJson.targets
      )) {
        const packageTarget = merged.targets[targetName];
        merged.targets[targetName] = packageTarget
          ? {
              ...packageTarget,
              ...projectTarget,
              options: { ...packageTarget.options, ...projectTarget.options },
            }
          : projectTarget;
      }
    }
  }

  if (!merged.name && packageName) {
    merged.name = packageName;
  }

  if (!merged.name) {
    throw new Error(
      `No project name found in configuration at ${projectRoot}. ` +
        `Please ensure the project has a name defined in project.json or package.json.`
    );
  }

  return merged;
}
