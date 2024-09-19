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
import { ExecutorContext, logger } from '@nx/devkit';
import {
  configureRegistry,
  type Environment,
  VERDACCIO_ENV_TOKEN,
} from './npm';
import runKillProcessExecutor from '../kill-process/executor';

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
  options: BootstrapEnvironmentOptions & {
    projectName: string;
  }
): Promise<BootstrapEnvironmentResult> {
  const { verbose, environmentRoot } = options;

  const registryResult = await startVerdaccioServer({
    storage: join(environmentRoot, 'storage'),
    readyWhen: 'Environment ready under',
    keepServerRunning: true,
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

  return activeRegistry;
}
