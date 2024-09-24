import { type ExecutorContext, logger, readJsonFile } from '@nx/devkit';
import { join } from 'node:path';
import { executeProcess } from '../../internal/execute-process';
import { objectToCliArgs } from '../../internal/terminal';
import type { VerdaccioProcessResult } from '../bootstrap/verdaccio-registry';
import type { SetupEnvironmentExecutorOptions } from './schema';

import { VERDACCIO_REGISTRY_JSON } from '../bootstrap/constants';
import {
  DEFAULT_BOOTSTRAP_TARGET,
  DEFAULT_INSTALL_TARGET,
  DEFAULT_STOP_VERDACCIO_TARGET,
} from '../../internal/constants';
import { runSingleExecutor } from '../../internal/run-executor';

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
        target: DEFAULT_BOOTSTRAP_TARGET,
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
    logger.error(error);
    return {
      success: false,
      command: `Failed executing target ${DEFAULT_BOOTSTRAP_TARGET}\n ${error.message}`,
    };
  }

  try {
    await executeProcess({
      command: 'nx',
      args: objectToCliArgs({
        _: [DEFAULT_INSTALL_TARGET, projectName],
        environmentRoot,
      }),
      cwd: process.cwd(),
      ...(verbose ? { verbose } : {}),
    });
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      command: `Fails executing target ${DEFAULT_INSTALL_TARGET}\n ${error.message}`,
    };
  }

  try {
    if (!keepServerRunning) {
      await runSingleExecutor(
        {
          project: projectName,
          target: DEFAULT_STOP_VERDACCIO_TARGET,
          configuration,
        },
        {
          verbose,
          filePath: join(environmentRoot, VERDACCIO_REGISTRY_JSON),
        },
        context
      );
    } else {
      const { url } = readJsonFile<VerdaccioProcessResult>(
        join(environmentRoot, VERDACCIO_REGISTRY_JSON)
      );
      logger.info(`Verdaccio server kept running under : ${url}`);
    }
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      command: error,
    };
  }

  return Promise.resolve({
    success: true,
    command: 'Environment setup complete.',
  } satisfies ExecutorOutput);
}