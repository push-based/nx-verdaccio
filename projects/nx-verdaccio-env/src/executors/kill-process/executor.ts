import { type ExecutorContext, logger } from '@nx/devkit';
import type { KillProcessExecutorOptions } from './schema';
import { join } from 'node:path';
import { killProcessFromPid } from './kill-process';
import {
  DEFAULT_PROCESS_FILENAME,
  EXECUTOR_ENVIRONMENT_KILL_PROCESS,
} from './constant';
import { PACKAGE_NAME } from '../../plugin/constants';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runKillProcessExecutor(
  options: KillProcessExecutorOptions
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
    `Execute ${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS} with options: ${JSON.stringify(
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
