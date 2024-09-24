import { type ExecutorContext, logger } from '@nx/devkit';
import type { KillProcessExecutorOptions } from './schema';
import { join } from 'node:path';
import { killProcessFromPid } from './kill-process';
import { DEFAULT_PROCESS_FILENAME } from './constant';
import {
  KILL_PROCESS_EXECUTOR_NAME,
  PACKAGE_NAME,
} from '../../internal/constants';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runKillProcessExecutor(
  options: KillProcessExecutorOptions,
  _: ExecutorContext
): Promise<ExecutorOutput> {
  const {
    environmentRoot,
    pid,
    cleanFs = true,
    dryRun = false,
    verbose = false,
    filePath = join(environmentRoot ?? '', DEFAULT_PROCESS_FILENAME),
  } = options;

  logger.info(
    `Execute ${PACKAGE_NAME}:${KILL_PROCESS_EXECUTOR_NAME} with options: ${JSON.stringify(
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
