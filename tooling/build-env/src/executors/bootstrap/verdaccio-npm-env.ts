import { join } from 'node:path';
import {
  startVerdaccioServer,
  type StarVerdaccioOptions,
  type VercaddioServerResult,
  type VerdaccioProcessResult,
} from './verdaccio-registry';
import { writeFile } from 'node:fs/promises';
import { setupNpmWorkspace } from './npm';
import { formatInfo } from '../../internal/utils/logging';
import { objectToCliArgs } from '../../internal/utils/terminal';
import { execSync } from 'node:child_process';
import { VERDACCIO_REGISTRY_JSON } from './constants';
import { logger } from '@nx/devkit';

export const VERDACCIO_ENV_TOKEN = 'Verdaccio Env: ';

export type Environment = {
  root: string;
};

export type BootstrapEnvironmentOptions = Partial<
  StarVerdaccioOptions & Environment
> &
  Required<Pick<StarVerdaccioOptions, 'projectName'>>;

export type BootstrapEnvironmentResult = Environment & {
  registry: VercaddioServerResult;
  stop: () => void;
};

export async function bootstrapEnvironment({
  verbose = false,
  environmentRoot,
  ...opts
}: BootstrapEnvironmentOptions & {
  environmentRoot: string;
}): Promise<BootstrapEnvironmentResult> {
  const storage = join(environmentRoot, 'storage');
  const registryResult = await startVerdaccioServer({
    storage,
    verbose,
    ...opts,
  });

  // set up NPM workspace environment
  await setupNpmWorkspace(environmentRoot, verbose);
  const userconfig = join(environmentRoot, '.npmrc');
  configureRegistry({ ...registryResult.registry, userconfig }, verbose);

  const activeRegistry: BootstrapEnvironmentResult = {
    ...registryResult,
    root: environmentRoot,
  };

  logger.info(
    formatInfo(
      `Save active verdaccio registry data to file: ${activeRegistry.root}`,
      VERDACCIO_ENV_TOKEN
    )
  );
  await writeFile(
    join(activeRegistry.root, VERDACCIO_REGISTRY_JSON),
    JSON.stringify(activeRegistry.registry, null, 2)
  );

  logger.info(
    formatInfo(
      `Environment ready under: ${activeRegistry.root}`,
      VERDACCIO_ENV_TOKEN
    )
  );

  return activeRegistry;
}

export type ConfigureRegistryOptions = Pick<
  VerdaccioProcessResult,
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
  VerdaccioProcessResult,
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
