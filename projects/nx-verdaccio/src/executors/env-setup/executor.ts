import { type ExecutorContext, logger, readJsonFile } from '@nx/devkit';
import { join } from 'node:path';
import { executeProcess } from '../../internal/execute-process';
import { objectToCliArgs } from '../../internal/terminal';
import type { VerdaccioProcessResult } from '../env-bootstrap/verdaccio-registry';
import type { SetupEnvironmentExecutorOptions } from './schema';

import { VERDACCIO_REGISTRY_JSON } from '../env-bootstrap/constants';
import {
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_INSTALL,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
} from '../../plugin/targets/environment.targets';
import { runSingleExecutor } from '../../internal/run-executor';
import { rm } from 'node:fs/promises';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runSetupEnvironmentExecutor(
  terminalAndExecutorOptions: SetupEnvironmentExecutorOptions,
  context: ExecutorContext
) {
  const { configurationName: configuration, projectName } = context;
  const { verbose, environmentRoot, keepServerRunning } =
    terminalAndExecutorOptions;
  try {
    await runSingleExecutor(
      {
        project: projectName,
        target: TARGET_ENVIRONMENT_BOOTSTRAP,
        configuration,
      },
      {
        ...terminalAndExecutorOptions,
        // we always want to keep the server running as in the next step we install packages
        // the `keepServerRunning` passed in `options` is only used to stop the server after the installation (or keep it running for debug reasons)
        keepServerRunning: true,
      },
      context
    );
  } catch (error) {
    logger.error(error.message);
    return {
      success: false,
      command: `Failed executing target ${TARGET_ENVIRONMENT_BOOTSTRAP}\n ${error.message}`,
    };
  }

  try {
    await executeProcess({
      command: 'nx',
      args: objectToCliArgs({
        _: [TARGET_ENVIRONMENT_INSTALL, projectName],
        environmentRoot,
        ...(verbose ? { verbose } : {}),
      }),
      cwd: process.cwd(),
      ...(verbose ? { verbose } : {}),
    });
  } catch (error) {
    logger.error(error.message);
    return {
      success: false,
      command: `Fails executing target ${TARGET_ENVIRONMENT_INSTALL}\n ${error.message}`,
    };
  }

  try {
    if (!keepServerRunning) {
      await runSingleExecutor(
        {
          project: projectName,
          target: TARGET_ENVIRONMENT_VERDACCIO_STOP,
          configuration,
        },
        {
          ...(verbose ? { verbose } : {}),
          filePath: join(environmentRoot, VERDACCIO_REGISTRY_JSON),
        },
        context
      );
      // delete storage, npmrc
      await rm(join(environmentRoot, 'storage'), {
        recursive: true,
        force: true,
        retryDelay: 100,
        maxRetries: 2,
      });
      await rm(join(environmentRoot, '.npmrc'), {
        recursive: true,
        force: true,
        retryDelay: 100,
        maxRetries: 2,
      });
    } else {
      const { url } = readJsonFile<VerdaccioProcessResult>(
        join(environmentRoot, VERDACCIO_REGISTRY_JSON)
      );
      logger.info(`Verdaccio server kept running under : ${url}`);
    }
  } catch (error) {
    logger.error(error.message);
    return {
      success: false,
      command: error.message,
    };
  }

  return Promise.resolve({
    success: true,
    command: 'Environment env-setup complete.',
  } satisfies ExecutorOutput);
}
