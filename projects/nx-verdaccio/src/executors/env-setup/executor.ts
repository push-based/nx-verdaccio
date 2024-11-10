import { type ExecutorContext, logger } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { executeProcess } from '../../internal/execute-process';
import { objectToCliArgs } from '../../internal/terminal';
import {
  stopVerdaccioServer,
  type VerdaccioProcessResult,
} from '../env-bootstrap/verdaccio-registry';
import type { SetupEnvironmentExecutorOptions } from './schema';
import { VERDACCIO_REGISTRY_JSON } from '../env-bootstrap/constants';
import {
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_INSTALL,
} from '../../plugin/targets/environment.targets';
import { runSingleExecutor } from '../../internal/run-executor';
import { getEnvironmentRoot } from '../../internal/environment-root';
import {cleanupEnv} from "../internal/cleanup-env";

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
  const { verbose, keepServerRunning } = terminalAndExecutorOptions;
  const environmentRoot = getEnvironmentRoot(
    context,
    terminalAndExecutorOptions
  );
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
      command: 'npx',
      args: objectToCliArgs({
        _: ['nx', TARGET_ENVIRONMENT_INSTALL, projectName],
        environmentRoot,
        ...(verbose ? { verbose } : {}),
      }),
      cwd: process.cwd(),
      ...(verbose ? { verbose } : {}),
    });
  } catch (error) {
    logger.error(error.message);
    await stopVerdaccioServer({
      projectName,
      verbose,
      context,
      configuration,
      environmentRoot,
    });

    return {
      success: false,
      command: `Fails executing target ${TARGET_ENVIRONMENT_INSTALL}\n ${error.message}`,
    };
  }

  try {
    if (!keepServerRunning) {
      await stopVerdaccioServer({
        projectName,
        verbose,
        context,
        configuration,
        environmentRoot,
      });
      // delete storage, .npmrc
      await cleanupEnv(environmentRoot)
    } else {
      const { url } = await readFile(
        join(environmentRoot, VERDACCIO_REGISTRY_JSON),
        'utf8'
      ).then((file) => JSON.parse(file) as VerdaccioProcessResult);
      logger.info(`Verdaccio server kept running under : ${url}`);
    }
  } catch (error) {
    await stopVerdaccioServer({
      projectName,
      verbose,
      context,
      configuration,
      environmentRoot,
    });

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
