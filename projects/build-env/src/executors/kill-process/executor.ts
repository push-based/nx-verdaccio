import { type ExecutorContext, logger } from '@nx/devkit';

import type { KillProcessExecutorOptions } from './schema';
import { join } from 'node:path';
import { killProcessFromPid } from './kill-process';
import { normalizeExecutorOptions } from '../internal/normalize-options';
import { DEFAULT_PROCESS_FILENAME } from './constant';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runKillProcessExecutor(
  options: KillProcessExecutorOptions,
  context: ExecutorContext
): Promise<ExecutorOutput> {
  const { options: opt } = normalizeExecutorOptions(context, options);
  const {
    environmentRoot,
    pid,
    cleanFs = true,
    dryRun = false,
    verbose = false,
    filePath = join(environmentRoot ?? '', DEFAULT_PROCESS_FILENAME),
  } = opt;

  logger.info(
    `Execute @push-based/build-env:kill-process with options: ${JSON.stringify(
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
    return {
      success: false,
      command: 'Failed killing process.',
    };
  }
  return {
    success: true,
    command: 'Process killed successfully.',
  };
}
