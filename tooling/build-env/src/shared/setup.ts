import { join } from 'node:path';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../internal/constants';

export function getEnvironmentsRoot(
  environmentsDir: string = DEFAULT_ENVIRONMENTS_OUTPUT_DIR
) {
  return environmentsDir;
}

/**
 * Nx by default takes the project name of the current task target (env.NX_TASK_TARGET_PROJECT)
 *
 * @param projectName
 * @param environmentsDir
 */
export function getEnvironmentRoot(
  projectName = process.env['NX_TASK_TARGET_PROJECT'],
  environmentsDir?: string
) {
  return join(getEnvironmentsRoot(environmentsDir), projectName);
}
