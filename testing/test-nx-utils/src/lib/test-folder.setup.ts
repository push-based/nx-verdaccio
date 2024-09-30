import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

export async function setupTestFolder(dirName: string) {
  await mkdir(dirName, { recursive: true });
}

export async function teardownTestFolder(dirName: string) {
  await rm(dirName, { recursive: true, force: true });
}

/**
 * Nx by default takes the project name of the current task target (env.NX_TASK_TARGET_PROJECT)
 *
 * @param projectName
 */
export function getTestEnvironmentRoot(projectName: string) {
  return join('tmp', 'environments', projectName);
}
