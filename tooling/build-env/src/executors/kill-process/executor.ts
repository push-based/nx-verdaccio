import { type ExecutorContext, logger } from '@nx/devkit';

import type { KillProcessExecutorOptions } from './schema';
import { join } from 'node:path';
import { killProcessFromPid } from '../../internal/utils/kill-process';
import { normalizeOptions } from '../internal/normalize-options';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runKillProcessExecutor(
  options: KillProcessExecutorOptions,
  context: ExecutorContext
) {
  const { options: opt } = normalizeOptions(context, options);
  const {
    environmentRoot,
    pid,
    cleanFs = true,
    dryRun = false,
    verbose = false,
    filePath = join(environmentRoot ?? '', 'process.json'),
  } = opt;

  logger.info(
    `Execute @org/stop-verdaccio-env:kill-process with options: ${JSON.stringify(
      options,
      null,
      2
    )}`
  );
  try {
    if (pid) {
      process.kill(Number(pid));
    } else {
      killProcessFromPid(filePath, { cleanFs, dryRun, verbose });
    }
  } catch (error) {
    logger.error(error);
  }
  return Promise.resolve({
    success: true,
    command: 'Process killed successfully.',
  } satisfies ExecutorOutput);
}
