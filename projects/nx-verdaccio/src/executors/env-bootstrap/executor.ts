import { type ExecutorContext, logger } from '@nx/devkit';
import { join } from 'node:path';
import { getEnvironmentRoot } from '../../internal/environment-root';
import { formatInfo } from '../../internal/logging';
import { runSingleExecutor } from '../../internal/run-executor';
import {
  DEFAULT_ENVIRONMENT_TARGETS,
  PACKAGE_NAME,
} from '../../plugin/constants';
import {
  bootstrapEnvironment,
  type BootstrapEnvironmentResult,
} from './bootstrap-env';
import { VERDACCIO_REGISTRY_JSON } from './constants';
import { VERDACCIO_ENV_TOKEN } from './npm';
import type { BootstrapExecutorOptions } from './schema';

export type BootstrapExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export async function bootstrapExecutor(
  options: BootstrapExecutorOptions,
  context: ExecutorContext
): Promise<BootstrapExecutorOutput> {
  const { configurationName, projectName, targetName } = context;
  const {
    keepServerRunning,
    verbose,
    verdaccioStartTarget = DEFAULT_ENVIRONMENT_TARGETS.verdaccioStart,
    verdaccioStopTarget = DEFAULT_ENVIRONMENT_TARGETS.verdaccioStop,
  } = options;
  const environmentRoot = getEnvironmentRoot(context, options);

  if (verbose) {
    logger.info(
      `Execute ${PACKAGE_NAME}:${targetName} with options: ${JSON.stringify(
        options,
        null,
        2
      )}`
    );
  }

  let bootstrapResult: BootstrapEnvironmentResult;
  try {
    bootstrapResult = await bootstrapEnvironment({
      projectName,
      environmentRoot,
      verbose,
      verdaccioStartTarget,
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
        target: verdaccioStopTarget,
        configuration: configurationName,
      },
      {
        verbose,
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
