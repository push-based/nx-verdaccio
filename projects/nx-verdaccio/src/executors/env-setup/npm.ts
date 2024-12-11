import { logger } from '@nx/devkit';
import { formatError, formatInfo } from '../../internal/logging';
import { ensureDirectoryExists } from '../../internal/file-system';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { NPM_ENV_TOKEN } from '../env-bootstrap/npm';

export async function setupNpmWorkspace(
  environmentRoot: string,
  verbose?: boolean
): Promise<void> {
  if (verbose) {
    logger.info(
      formatInfo(
        `Execute: npm init in directory ${environmentRoot}`,
        NPM_ENV_TOKEN
      )
    );
  }
  const cwd = process.cwd();
  await ensureDirectoryExists(environmentRoot);
  try {
    await promisify(execFile)('npm', ['init', '--force'], {
      shell: true,
      windowsHide: true,
      cwd: join(cwd, environmentRoot),
    });
  } catch (error) {
    logger.error(
      formatError(
        `Error creating NPM workspace: ${(error as Error).message}`,
        NPM_ENV_TOKEN
      )
    );
  }
}
