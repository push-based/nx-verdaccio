import { type ExecutorContext, logger } from '@nx/devkit';

import type { KillProcessExecutorOptions } from './schema';
import { join } from 'node:path';
import { killProcessFromPid } from '../../internal/utils/process';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runKillProcessExecutor(
  terminalAndExecutorOptions: KillProcessExecutorOptions,
  context: ExecutorContext
) {
  const { projectName } = context;
  const { workspaceRoot } = {
    ...terminalAndExecutorOptions,
    workspaceRoot: join('tmp', 'environments', projectName),
  };

  logger.info(
    `Execute @org/stop-verdaccio-env:kill-process with options: ${JSON.stringify(
      terminalAndExecutorOptions,
      null,
      2
    )}`
  );
  try {
    const envResult = await killProcessFromPid(
      join(workspaceRoot, 'verdaccio-registry.json')
    );
    logger.info(`envResult: ${JSON.stringify(envResult, null, 2)}`);
  } catch (error) {
    logger.error(error);
  }
  return Promise.resolve({
    success: true,
    command: '????????',
  } satisfies ExecutorOutput);
}
