import { execFileSync, execSync } from 'node:child_process';
import { join } from 'node:path';
import { ensureDirectoryExists } from '../../internal/file-system';
import { formatError, formatInfo } from '../../internal/logging';
import { logger } from '@nx/devkit';
import type { VercaddioServerResult } from './verdaccio-registry';
import { objectToCliArgs } from '../../internal/terminal';

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

export const VERDACCIO_ENV_TOKEN = 'Verdaccio Env: ';

export type Environment = {
  environmentRoot: string;
};

export type ConfigureRegistryOptions = Pick<
  VercaddioServerResult,
  'port' | 'host' | 'url'
> & {
  userconfig?: string;
};

export function configureRegistry(
  { port, host, url, userconfig }: ConfigureRegistryOptions,
  verbose?: boolean
) {
  const setRegistry = `npm config set registry="${url}" ${objectToCliArgs({
    userconfig,
  }).join(' ')}`;
  if (verbose) {
    logger.info(
      formatInfo(`Set registry:\n${setRegistry}`, VERDACCIO_ENV_TOKEN)
    );
  }
  execSync(setRegistry);

  /**
   * Protocol-Agnostic Configuration: The use of // allows NPM to configure authentication for a registry without tying it to a specific protocol (http: or https:).
   * This is particularly useful when the registry might be accessible via both HTTP and HTTPS.
   *
   * Example: //registry.npmjs.org/:_authToken=your-token
   */
  const urlNoProtocol = `//${host}:${port}`;
  const token = 'secretVerdaccioToken';
  const setAuthToken = `npm config set ${urlNoProtocol}/:_authToken "${token}" ${objectToCliArgs(
    { userconfig }
  ).join(' ')}`;
  if (verbose) {
    logger.info(
      formatInfo(`Set authToken:\n${setAuthToken}`, VERDACCIO_ENV_TOKEN)
    );
  }
  execSync(setAuthToken);
}

export type UnconfigureRegistryOptions = Pick<
  VercaddioServerResult,
  'port' | 'host'
> & {
  userconfig?: string;
};
export function unconfigureRegistry(
  { port, host, userconfig }: UnconfigureRegistryOptions,
  verbose?: boolean
) {
  const urlNoProtocol = `//${host}:${port}`;
  const setAuthToken = `npm config delete ${urlNoProtocol}/:_authToken ${objectToCliArgs(
    { userconfig }
  ).join(' ')}`;
  if (verbose) {
    logger.info(
      formatInfo(`Delete authToken:\n${setAuthToken}`, VERDACCIO_ENV_TOKEN)
    );
  }
  execSync(setAuthToken);

  const setRegistry = `npm config delete registry ${objectToCliArgs({
    userconfig,
  }).join(' ')}`;
  if (verbose) {
    logger.info(
      formatInfo(`Delete registry:\n${setRegistry}`, VERDACCIO_ENV_TOKEN)
    );
  }
  execSync(setRegistry);
}
