import { type ExecutorContext, logger } from '@nx/devkit';
import type { BootstrapExecutorOptions } from './schema';
import {
  bootstrapEnvironment,
  type BootstrapEnvironmentResult,
} from './bootstrap-env';
import { formatInfo } from '../../internal/logging';
import { VERDACCIO_ENV_TOKEN } from './npm';
import { join } from 'node:path';
import { VERDACCIO_REGISTRY_JSON } from './constants';
import {
  DEFAULT_BOOTSTRAP_TARGET,
  DEFAULT_STOP_VERDACCIO_TARGET,
  PACKAGE_NAME,
} from '../../internal/constants';
import { runSingleExecutor } from '../../internal/run-executor';

export type BootstrapExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export async function bootstrapExecutor(
  options: BootstrapExecutorOptions,
  context: ExecutorContext
): Promise<BootstrapExecutorOutput> {
  const { configurationName, projectName } = context;
  const { keepServerRunning, environmentRoot } = options;

  logger.info(
    `Execute ${PACKAGE_NAME}:${DEFAULT_BOOTSTRAP_TARGET} with options: ${JSON.stringify(
      options,
      null,
      2
    )}`
  );

  let bootstrapResult: BootstrapEnvironmentResult;
  try {
    bootstrapResult = await bootstrapEnvironment({
      projectName,
      environmentRoot,
    });
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      command: error?.message ?? (error as Error).toString(),
    };
  }

  if (keepServerRunning) {
    const { registry } = bootstrapResult;
    const { url } = registry;
    logger.info(
      formatInfo(`Verdaccio server running under ${url}`, VERDACCIO_ENV_TOKEN)
    );
  } else {
    await runSingleExecutor(
      {
        project: projectName,
        target: DEFAULT_STOP_VERDACCIO_TARGET,
        configuration: configurationName,
      },
      {
        filePath: join(environmentRoot, VERDACCIO_REGISTRY_JSON),
      },
      context
    );
  }

  return {
    success: true,
    command: 'Bootstrapped environment successfully.',
  };
}

export default bootstrapExecutor;
