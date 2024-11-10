import {type ExecutorContext, logger} from '@nx/devkit';
import type {TeardownExecutorOptions} from './schema';
import {teardownEnvironment} from './teardown-env';
import {PACKAGE_NAME} from '../../plugin/constants';
import {EXECUTOR_ENVIRONMENT_TEARDOWN} from './constants';
import {type ExecutorOutput} from '../internal/executor-output';
import {getEnvironmentRoot} from "../../internal/environment-root";

export async function teardownExecutor(
  options: TeardownExecutorOptions,
  context: ExecutorContext
): Promise<ExecutorOutput> {
  const {verbose, skipTeardown} = options;
  const environmentRoot = getEnvironmentRoot(context, options);

  if (verbose) {
    logger.info(
      `Execute ${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_TEARDOWN} with options: ${JSON.stringify(
        options,
        null,
        2
      )}`
    );
  }
  if (!skipTeardown) {
    try {
      await teardownEnvironment(context, {
        environmentRoot,
        verbose,
      });
    } catch (error) {
      logger.error(error);
      return {
        success: false,
        command: error?.message ?? (error as Error).toString(),
      };
    }
  } else {
    logger.info(`Skip teardown environment in ${environmentRoot}`);
  }

  return {
    success: true,
    command: 'Teared down environment successfully.',
  };
}

export default teardownExecutor;
