import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { formatInfo } from '../../internal/logging';
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

export const VERDACCIO_ENV_TOKEN = 'Verdaccio Env: ';

export type Environment = {
  environmentRoot: string;
};

/**
 * configure env with verdaccio registry as default
 * exec commands:
 * - `npm config set registry "${url}"
 * - `npm config set //${host}:${port}/:_authToken "secretVerdaccioToken"`
 * @see {@link VerdaccioProcessResult}
 */
export type ConfigureRegistryOptions = Pick<
  VercaddioServerResult,
  'port' | 'host' | 'url'
> & {
  userconfig?: string;
};

export async function configureRegistry(
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

  await promisify(exec)(setRegistry, { windowsHide: true });

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
  await promisify(exec)(setAuthToken, { windowsHide: true });
}

export type UnconfigureRegistryOptions = Pick<
  VercaddioServerResult,
  'port' | 'host'
> & {
  userconfig?: string;
};

/**
 * unconfigure env with verdaccio registry as default
 * exec commands:
 * - `npm config delete //${host}:${port}/:_authToken`
 * - `npm config delete registry`
 * @see {@link VerdaccioProcessResult}
 **/
export async function unconfigureRegistry(
  { port, host, userconfig }: UnconfigureRegistryOptions,
  verbose?: boolean
) {
  /**
   * Protocol-Agnostic Configuration: The use of // allows NPM to configure authentication for a registry without tying it to a specific protocol (http: or https:).
   * This is particularly useful when the registry might be accessible via both HTTP and HTTPS.
   *
   * Example: //registry.npmjs.org/:_authToken=your-token
   */
  const urlNoProtocol = `//${host}:${port}`;
  const setAuthToken = `npm config delete ${urlNoProtocol}/:_authToken ${objectToCliArgs(
    { userconfig }
  ).join(' ')}`;
  if (verbose) {
    logger.info(
      formatInfo(`Delete authToken:\n${setAuthToken}`, VERDACCIO_ENV_TOKEN)
    );
  }
  await promisify(exec)(setAuthToken, { windowsHide: true });

  const setRegistry = `npm config delete registry ${objectToCliArgs({
    userconfig,
  }).join(' ')}`;
  if (verbose) {
    logger.info(
      formatInfo(`Delete registry:\n${setRegistry}`, VERDACCIO_ENV_TOKEN)
    );
  }
  await promisify(exec)(setRegistry, { windowsHide: true });
}
