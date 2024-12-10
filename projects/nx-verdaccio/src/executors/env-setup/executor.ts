import { type ExecutorContext, logger } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { executeProcess } from '../../internal/execute-process';
import { objectToCliArgs } from '../../internal/terminal';
import {
  stopVerdaccioServer,
  type VerdaccioProcessResult,
} from '../env-bootstrap/verdaccio-registry';
import { formatError, formatInfo } from '../../internal/logging';

import type { SetupEnvironmentExecutorOptions } from './schema';
import { VERDACCIO_REGISTRY_JSON } from '../env-bootstrap/constants';
import {
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_INSTALL,
  TARGET_ENVIRONMENT_PUBLISH_ONLY,
  TARGET_ENVIRONMENT_SETUP,
} from '../../plugin/targets/environment.targets';
import { runSingleExecutor } from '../../internal/run-executor';
import { getEnvironmentRoot } from '../../internal/environment-root';
import { cleanupEnv } from '../internal/cleanup-env';

import { setupNpmWorkspace } from './npm';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

const INFO_TOKEN = 'ENV SETUP';

export default async function runSetupEnvironmentExecutor(
  terminalAndExecutorOptions: SetupEnvironmentExecutorOptions,
  context: ExecutorContext
) {
  const { configurationName: configuration, projectName } = context;
  const { verbose, keepServerRunning, skipInstall, postScript } =
    terminalAndExecutorOptions;
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
    if (skipInstall) {
      logger.info(
        formatInfo(`Run target: ${TARGET_ENVIRONMENT_PUBLISH_ONLY}`, INFO_TOKEN)
      );
      await executeProcess({
        command: 'npx',
        args: objectToCliArgs({
          _: ['nx', TARGET_ENVIRONMENT_PUBLISH_ONLY, projectName],
          environmentRoot,
          ...(verbose ? { verbose } : {}),
        }),
        cwd: process.cwd(),
        ...(verbose ? { verbose } : {}),
      });
    } else {
      logger.info(
        formatInfo(`Run target: ${TARGET_ENVIRONMENT_INSTALL}`, INFO_TOKEN)
      );
      await setupNpmWorkspace(environmentRoot, verbose);
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
    }
    if (postScript) {
      const [command, ...args] = postScript.split(' ');
      logger.info(
        formatInfo(`Run postScript: ${command} ${args.join(' ')}`, INFO_TOKEN)
      );
      await executeProcess({
        command,
        args,
        cwd: process.cwd(),
        ...(verbose ? { verbose } : {}),
      });
    }
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
      await cleanupEnv(environmentRoot);
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
