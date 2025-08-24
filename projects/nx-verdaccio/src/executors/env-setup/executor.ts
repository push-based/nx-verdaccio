import { type ExecutorContext, logger } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { executeProcess } from '../../internal/execute-process';
import { formatInfo } from '../../internal/logging';
import { objectToCliArgs } from '../../internal/terminal';
import {
  stopVerdaccioServer,
  type VerdaccioProcessResult,
} from '../env-bootstrap/verdaccio-registry';

import { getEnvironmentRoot } from '../../internal/environment-root';
import { runSingleExecutor } from '../../internal/run-executor';
import { VERDACCIO_REGISTRY_JSON } from '../env-bootstrap/constants';
import { cleanupEnv } from '../internal/cleanup-env';
import type { SetupEnvironmentExecutorOptions } from './schema';

import { DEFAULT_ENVIRONMENT_TARGETS } from '../../plugin/constants';
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
  const {
    verbose,
    keepServerRunning,
    skipInstall,
    postScript,
    envBootstrapTarget = DEFAULT_ENVIRONMENT_TARGETS.bootstrap,
    envPublishOnlyTarget = DEFAULT_ENVIRONMENT_TARGETS.publishOnly,
    envInstallTarget = DEFAULT_ENVIRONMENT_TARGETS.install,
    verdaccioStopTarget = DEFAULT_ENVIRONMENT_TARGETS.verdaccioStop,
  } = terminalAndExecutorOptions;
  const environmentRoot = getEnvironmentRoot(
    context,
    terminalAndExecutorOptions
  );
  try {
    await runSingleExecutor(
      {
        project: projectName,
        target: envBootstrapTarget,
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
      command: `Failed executing target ${envBootstrapTarget}\n ${error.message}`,
    };
  }

  try {
    if (skipInstall) {
      logger.info(
        formatInfo(`Run target: ${envPublishOnlyTarget}`, INFO_TOKEN)
      );
      await executeProcess({
        command: 'npx',
        args: objectToCliArgs({
          _: ['nx', envPublishOnlyTarget, projectName],
          environmentRoot,
          envRoot: environmentRoot,
          ...(verbose ? { verbose } : {}),
        }),
        cwd: process.cwd(),
        ...(verbose ? { verbose } : {}),
      });
    } else {
      logger.info(formatInfo(`Run target: ${envInstallTarget}`, INFO_TOKEN));
      await setupNpmWorkspace(environmentRoot, verbose);
      await executeProcess({
        command: 'npx',
        args: objectToCliArgs({
          _: ['nx', envInstallTarget, projectName],
          environmentRoot,
          envRoot: environmentRoot,
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
      verdaccioStopTarget,
      verbose,
      context,
      configuration,
      environmentRoot,
    });

    return {
      success: false,
      command: `Fails executing target ${envInstallTarget}\n ${error.message}`,
    };
  }

  try {
    if (!keepServerRunning) {
      await stopVerdaccioServer({
        projectName,
        verdaccioStopTarget,
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
      verdaccioStopTarget,
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
