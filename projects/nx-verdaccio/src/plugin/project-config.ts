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
  const pkgNxConfig = packageJson.nx || packageJson._nx || {};

  // Create a normalized ProjectConfiguration
  const projectConfiguration: ProjectConfiguration = {
    name: packageJson.name,
    root: dirname(packageJsonFile),
    sourceRoot: pkgNxConfig.sourceRoot || `${dirname(packageJsonFile)}/src`,
    projectType: pkgNxConfig.projectType || 'library',
    tags: pkgNxConfig.tags || [],
    targets: pkgNxConfig.targets || {},
    ...pkgNxConfig,
  };

  return projectConfiguration;
}

export async function getProjectConfig(
  projectConfigFile: string,
  getConfig: (projectConfigFile: string) => Promise<ProjectConfiguration>,
  fallback: (projectConfigFile: string) => Promise<ProjectConfiguration>
): Promise<ProjectConfiguration> {
  const isPkgJson = projectConfigFile.endsWith('package.json');

  try {
    const primaryConfig = await getConfig(projectConfigFile);

    // For package.json files, the getPackageJsonNxConfig should always return a valid config
    // since it creates defaults for missing properties
    if (isPkgJson) {
      // If it's a package.json, we should have a valid config with name
      if (primaryConfig.name) {
        return primaryConfig;
      }
    }

    // For project.json files or if somehow the name is missing
    if (!('name' in primaryConfig) || typeof primaryConfig?.name !== 'string') {
      try {
        return await fallback(projectConfigFile);
      } catch (fallbackError) {
        // If both primary and fallback fail, return empty config
        // This handles cases like workspace root package.json with no project.json
        return {} as ProjectConfiguration;
      }
    }

    return primaryConfig;
  } catch (primaryError) {
    try {
      return await fallback(projectConfigFile);
    } catch (fallbackError) {
      // If both primary and fallback fail, return empty config
      return {} as ProjectConfiguration;
    }
  }
}
