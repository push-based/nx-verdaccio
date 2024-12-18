import type { ProjectConfiguration } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function getProjectJsonNxConfig(packageJsonFile: string) {
  const projectConfig: ProjectConfiguration = await readFile(
    join(process.cwd(), dirname(packageJsonFile), 'project.json'),
    'utf8'
  ).then(JSON.parse);
  if (!('name' in projectConfig) || typeof projectConfig.name !== 'string') {
    throw new Error('Project name is required');
  }
  return projectConfig;
}

export async function getPackageJsonNxConfig(packageJsonFile: string) {
  const { nx: pkgNxConfig = {} } = await readFile(
    join(process.cwd(), packageJsonFile),
    'utf8'
  ).then(JSON.parse);
  return pkgNxConfig;
}

export async function getProjectConfig(
  projectConfigFile,
  getConfig: (projectConfigFile: string) => Promise<ProjectConfiguration>,
  fallback: (projectConfigFile: string) => Promise<ProjectConfiguration>
) {
  const pkgNxConfig = await getConfig(projectConfigFile);

  if (!('name' in pkgNxConfig) || typeof pkgNxConfig?.name !== 'string') {
    return await fallback(projectConfigFile);
  }
  return pkgNxConfig;
}
