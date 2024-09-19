import { type ExecutorContext, logger } from '@nx/devkit';
import type { BootstrapExecutorOptions } from './schema';
import {
  bootstrapEnvironment,
  BootstrapEnvironmentResult,
} from './bootstrap-env';
import { normalizeExecutorOptions } from '../internal/normalize-options';
import { formatInfo } from '../../internal/logging';
import { VERDACCIO_ENV_TOKEN } from './npm';
import runKillProcessExecutor from '../kill-process/executor';
import { join } from 'node:path';
import { VERDACCIO_REGISTRY_JSON } from './constants';
import * as process from 'process';

export type BootstrapExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runBootstrapExecutor(
  options: BootstrapExecutorOptions,
  context: ExecutorContext
) {
  const { options: normalizedOptions } = normalizeExecutorOptions(
    context,
    options
  );
  const { projectName } = context;
  const { keepServerRunning, environmentRoot } = normalizedOptions;

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
      ...normalizedOptions,
    });
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      command: error,
    };
  }

  if (keepServerRunning) {
    const { registry, root } = bootstrapResult;
    logger.info(
      formatInfo(`Environment ready under: ${root}`, VERDACCIO_ENV_TOKEN)
    );
    logger.info(
      formatInfo(
        `Verdaccio server is running on ${registry.url}`,
        VERDACCIO_ENV_TOKEN
      )
    );
  } else {
    await runKillProcessExecutor(
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
