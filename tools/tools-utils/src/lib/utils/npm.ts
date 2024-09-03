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

export async function setupNpmWorkspace(directory: string, verbose?: boolean) {
  if (verbose) {
    logInfo(`Execute: npm init in directory ${directory}`);
  }
  const cwd = process.cwd();
  await ensureDirectoryExists(directory);
  process.chdir(join(cwd, directory));
  try {
    execFileSync('npm', ['init', '--force']).toString();
  } catch (error) {
    logError(`Error creating NPM workspace: ${(error as Error).message}`);
  } finally {
    process.chdir(cwd);
  }
}
