import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ensureDirectoryExists } from '../utils/file-system';
import { formatError, formatInfo } from '../utils/logging';
import { logger } from '@nx/devkit';

export const NPM_ENV_TOKEN = 'Npm Env: ';

/*
@TODO:
This is here to be able to better mock chdir.
We should definitely find a better solution that mocks it directly and avoids this wrapper completely.
*/
export function chdir(path: string): void {
  process.chdir(path);
}

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
  chdir(join(cwd, environmentRoot));
  try {
    execFileSync('npm', ['init', '--force']).toString();
  } catch (error) {
    logger.error(
      formatError(
        `Error creating NPM workspace: ${(error as Error).message}`,
        NPM_ENV_TOKEN
      )
    );
  } finally {
    chdir(cwd);
  }
}
