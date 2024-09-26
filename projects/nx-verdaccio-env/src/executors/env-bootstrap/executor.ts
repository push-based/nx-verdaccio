import { type ExecutorContext, logger } from '@nx/devkit';
import type { BootstrapExecutorOptions } from './schema';
import {
  bootstrapEnvironment,
  type BootstrapEnvironmentResult,
} from './bootstrap-env';
import { join } from 'node:path';
import { formatInfo } from '../../internal/logging';
import { VERDACCIO_ENV_TOKEN } from './npm';
import { VERDACCIO_REGISTRY_JSON } from './constants';
import {
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
} from '../../plugin/targets/environment.targets';
import { runSingleExecutor } from '../../internal/run-executor';
import { PACKAGE_NAME } from '../../plugin/constants';

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
    `Execute ${PACKAGE_NAME}:${TARGET_ENVIRONMENT_BOOTSTRAP} with options: ${JSON.stringify(
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
        target: TARGET_ENVIRONMENT_VERDACCIO_STOP,
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
