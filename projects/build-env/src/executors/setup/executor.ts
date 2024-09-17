import { type ExecutorContext, logger, readJsonFile } from '@nx/devkit';
import { join } from 'node:path';
import runBootstrapExecutor from '../bootstrap/executor';
import runKillProcessExecutor from '../kill-process/executor';
import { executeProcess } from '../../internal/execute-process';
import { objectToCliArgs } from '../../internal/terminal';
import type { VerdaccioProcessResult } from '../bootstrap/verdaccio-registry';
import type { SetupEnvironmentExecutorOptions } from './schema';
import { normalizeOptions } from '../internal/normalize-options';

import { VERDACCIO_REGISTRY_JSON } from '../bootstrap/constants';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runSetupEnvironmentExecutor(
  terminalAndExecutorOptions: SetupEnvironmentExecutorOptions,
  context: ExecutorContext
) {
  const { projectName } = context;
  const normalizedContext = normalizeOptions(
    context,
    terminalAndExecutorOptions
  );
  const { options: normalizedOptions } = normalizedContext;

  try {
    await runBootstrapExecutor(
      {
        ...normalizedOptions,
      },
      context
    );
    const {
      environmentRoot,
      keepServerRunning,
      verbose = true,
    } = normalizedOptions;

    await executeProcess({
      command: 'nx',
      args: objectToCliArgs({
        _: ['install-env', projectName],
        environmentProject: projectName,
        environmentRoot,
      }),
      cwd: process.cwd(),
      verbose,
    });

    if (!keepServerRunning) {
      await runKillProcessExecutor(
        {
          ...normalizedOptions,
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
    return {
      success: true,
      command: 'Environment setup complete.',
    } satisfies ExecutorOutput;
  } catch (error) {
    // nx build-env cli-e2e
    logger.error(error);
    return {
      success: false,
      command: error,
    };
  }
}
