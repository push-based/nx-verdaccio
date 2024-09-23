import { type ExecutorContext, logger, runExecutor } from '@nx/devkit';
import type { BootstrapExecutorOptions } from './schema';
import {
  bootstrapEnvironment,
  type BootstrapEnvironmentResult,
} from './bootstrap-env';
import { formatInfo } from '../../internal/logging';
import { VERDACCIO_ENV_TOKEN } from './npm';
import { join } from 'node:path';
import { VERDACCIO_REGISTRY_JSON } from './constants';
import { DEFAULT_STOP_VERDACCIO_TARGET } from '../../internal/constants';

export type BootstrapExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runBootstrapExecutor(
  options: BootstrapExecutorOptions,
  context: ExecutorContext
) {
  const { configurationName, projectName } = context;
  const { keepServerRunning, environmentRoot } = options;

  logger.info(
    `Execute @push-based/build-env:bootstrap with options: ${JSON.stringify(
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
      keepServerRunning,
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
    await runExecutor(
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

  return Promise.resolve({
    success: true,
    command: 'Bootstraped environemnt successfully.',
  } satisfies BootstrapExecutorOutput);
}
