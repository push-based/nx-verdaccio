import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ensureDirectoryExists } from './utils';
import { error, info } from './logging';

export function logInfo(msg: string) {
  info(msg, 'Npm Env: ');
}

export function logError(msg: string) {
  error(msg, 'Npm Env: ');
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
  process.chdir(join(cwd, environmentRoot));
  try {
    execFileSync('npm', ['init', '--force']).toString();
  } catch (error) {
    logError(`Error creating NPM workspace: ${(error as Error).message}`);
  } finally {
    process.chdir(cwd);
  }
}
