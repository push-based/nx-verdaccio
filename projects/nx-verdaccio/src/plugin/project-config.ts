import type { ProjectConfiguration } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function getProjectJsonNxConfig(configFile: string) {
  // If the configFile is already a project.json, use it directly
  // If it's a package.json, look for project.json in the same directory
  const projectJsonPath = configFile.endsWith('project.json')
    ? join(process.cwd(), configFile)
    : join(process.cwd(), dirname(configFile), 'project.json');

  const projectConfig: ProjectConfiguration = await readFile(
    projectJsonPath,
    'utf8'
  ).then(JSON.parse);
  if (!('name' in projectConfig) || typeof projectConfig.name !== 'string') {
    throw new Error('Project name is required');
  }
  return projectConfig;
}

export async function getPackageJsonNxConfig(
  packageJsonFile: string
): Promise<ProjectConfiguration> {
  const packageJson = await readFile(
    join(process.cwd(), packageJsonFile),
    'utf8'
  ).then(JSON.parse);

  // Check for both 'nx' and '_nx' properties (Nx supports both)
  const pkgNxConfig = packageJson.nx || {};
  return {
    name: packageJson.name,
    root: dirname(packageJsonFile),
    ...pkgNxConfig,
  };
}

export async function getProjectConfig(
  projectConfigFile,
  getConfig: (projectConfigFile: string) => Promise<ProjectConfiguration>,
  fallback: (projectConfigFile: string) => Promise<ProjectConfiguration>
) {
  try {
    const pkgNxConfig = await getConfig(projectConfigFile);

    if (!('name' in pkgNxConfig) || typeof pkgNxConfig?.name !== 'string') {
      try {
        return await fallback(projectConfigFile);
      } catch (fallbackError) {
        // If both primary and fallback fail, return empty config
        // This handles cases like workspace root package.json with no project.json
        return {} as ProjectConfiguration;
      }
    }
    return pkgNxConfig;
  } catch (primaryError) {
    try {
      return await fallback(projectConfigFile);
    } catch (fallbackError) {
      // If both primary and fallback fail, return empty config
      return {} as ProjectConfiguration;
    }
  }
}
