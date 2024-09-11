import { type ExecutorContext, logger, readJsonFile } from '@nx/devkit';
import { join } from 'node:path';
import runBuildExecutor from '../bootstrap/executor';
import runKillProcessExecutor from '../kill-process/executor';
import { executeProcess } from '../../internal/utils/execute-process';
import { objectToCliArgs } from '../../internal/utils/terminal-command';
import type { VerdaccioProcessResult } from '../../internal/verdaccio/verdaccio-registry';
import type { SetupEnvironmentExecutorOptions } from './schema';
import { normalizeOptions } from '../internal/normalize-options';
import { VERDACCIO_REGISTRY_JSON } from '../../internal/verdaccio/verdaccio-npm-env';

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
    await runBuildExecutor(
      {
        ...normalizedOptions,
      },
      context
    );
    const {environmentRoot, keepServerRunning, verbose = true} = normalizedOptions;

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
          filePath: join(
            environmentRoot,
            VERDACCIO_REGISTRY_JSON
          ),
        },
        context
      );
    } else {
      const {url} = readJsonFile<VerdaccioProcessResult>(
        join(environmentRoot, VERDACCIO_REGISTRY_JSON)
      );
      logger.info(`Verdaccio server kept running under : ${url}`);
    }
  } catch (error) {
    // nx build-env cli-e2e
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
