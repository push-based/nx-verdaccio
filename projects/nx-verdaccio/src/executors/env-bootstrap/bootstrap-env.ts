import { join } from 'node:path';
import {
  type RegistryResult,
  startVerdaccioServer,
  type StartVerdaccioOptions,
  type VercaddioServerResult,
} from './verdaccio-registry';
import { writeFile } from 'node:fs/promises';
import { setupNpmWorkspace } from './npm';
import { formatError, formatInfo } from '../../internal/logging';
import { VERDACCIO_REGISTRY_JSON } from './constants';
import { logger } from '@nx/devkit';
import {
  configureRegistry,
  type Environment,
  VERDACCIO_ENV_TOKEN,
} from './npm';

export type BootstrapEnvironmentOptions = StartVerdaccioOptions & Environment;

export type BootstrapEnvironmentResult = Environment & {
  registry: VercaddioServerResult;
  stop: () => void;
};

export async function bootstrapEnvironment(
  options: BootstrapEnvironmentOptions
): Promise<BootstrapEnvironmentResult> {
  const { verbose, environmentRoot, storage, ...rest } = options;
  const parsedStorage = storage ?? join(environmentRoot, 'storage');

  let registryResult: RegistryResult
  try {
    registryResult = await startVerdaccioServer({
      storage: parsedStorage,
      verbose,
      readyWhen: 'Environment ready under',
      ...(rest as StartVerdaccioOptions),
    });
  } catch (error) {
    logger.error(
      formatError(
        `Error starting verdaccio registry: ${(error as Error).message}`,
        VERDACCIO_ENV_TOKEN
      )
    );
    throw error;
  }
  const { registry } = registryResult;

  try {
    const { url, port, host } = registry;
    await setupNpmWorkspace(environmentRoot, verbose);
    const userconfig = join(environmentRoot, '.npmrc');
    configureRegistry({ url, port, host, userconfig }, verbose);
  } catch (error) {
    logger.error(
      formatError(
        `Error configuring verdaccio NPM registry: ${(error as Error).message}`,
        VERDACCIO_ENV_TOKEN
      )
    );
    throw error;
  }

  try {
    await writeFile(
      join(environmentRoot, VERDACCIO_REGISTRY_JSON),
      JSON.stringify(registry, null, 2)
    ); // NOTICE: This is a "readyWhen" condition
    logger.info(
      formatInfo(
        `Environment ready under: ${environmentRoot}`,
        VERDACCIO_ENV_TOKEN
      )
    );
    return {
      ...registryResult,
      environmentRoot: environmentRoot,
    };
  } catch (error) {
    logger.error(
      formatError(
        `Error saving verdaccio registry data to ${environmentRoot}: ${
          (error as Error).message
        }`,
        VERDACCIO_ENV_TOKEN
      )
    );
    throw new Error(`Error saving verdaccio registry data. ${error.message}`);
  }
}
