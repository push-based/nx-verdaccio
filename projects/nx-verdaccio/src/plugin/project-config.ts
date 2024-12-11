import type { ProjectConfiguration } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function getProjectConfig(packageJsonFile: string) {
  const { nx: pkgNxConfig = {} } = await readFile(
    join(process.cwd(), packageJsonFile),
    'utf8'
  ).then(JSON.parse);
  if (!('name' in pkgNxConfig) || typeof pkgNxConfig?.name !== 'string') {
    // fallback to project.json
    const projectConfig: ProjectConfiguration = await readFile(
      join(process.cwd(), dirname(packageJsonFile), 'project.json'),
      'utf8'
    ).then(JSON.parse);
    if (!('name' in projectConfig) || typeof projectConfig.name !== 'string') {
      throw new Error('Project name is required');
    }
    return projectConfig;
  }
  return pkgNxConfig;
}
