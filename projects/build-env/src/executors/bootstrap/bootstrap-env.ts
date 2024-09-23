import { join } from 'node:path';
import {
  startVerdaccioServer,
  type StarVerdaccioOptions,
  type VercaddioServerResult,
} from './verdaccio-registry';
import { writeFile } from 'node:fs/promises';
import { setupNpmWorkspace } from './npm';
import { formatInfo } from '../../internal/logging';
import { VERDACCIO_REGISTRY_JSON } from './constants';
import { logger } from '@nx/devkit';
import {
  configureRegistry,
  type Environment,
  VERDACCIO_ENV_TOKEN,
} from './npm';

export type BootstrapEnvironmentOptions = Partial<
  StarVerdaccioOptions & Environment
> & {
  keepServerRunning?: boolean;
  projectName: string;
  environmentRoot: string;
};

export type BootstrapEnvironmentResult = Environment & {
  registry: VercaddioServerResult;
  stop: () => void;
};

export async function bootstrapEnvironment(
  options
): Promise<BootstrapEnvironmentResult> {
  const { verbose, environmentRoot, storage } = options;
  const registryResult = await startVerdaccioServer({
    storage: storage ?? join(environmentRoot, 'storage'),
    verbose,
    readyWhen: 'Environment ready under',
    keepServerRunning: false,
    ...options,
  });

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
