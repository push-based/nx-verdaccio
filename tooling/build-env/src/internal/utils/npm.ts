import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ensureDirectoryExists } from './file-system';
import { error, info } from './logging';
import * as process from 'process';

export function logInfo(msg: string) {
  info(msg, 'Npm Env: ');
}

export function logError(msg: string) {
  error(msg, 'Npm Env: ');
}

/*
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
    logInfo(`Execute: npm init in directory ${environmentRoot}`);
  }
  const cwd = process.cwd();
  await ensureDirectoryExists(environmentRoot);
  chdir(join(cwd, environmentRoot));
  try {
    execFileSync('npm', ['init', '--force']).toString();
  } catch (error) {
    logError(`Error creating NPM workspace: ${(error as Error).message}`);
  } finally {
    chdir(cwd);
  }
}
