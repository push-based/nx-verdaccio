import {type ExecutorContext, logger} from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import type {BuildExecutorOptions} from './schema';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default function runBuildExecutor(
  terminalAndExecutorOptions: BuildExecutorOptions,
  context: ExecutorContext,
) {

  logger.info(`Execute @org/build-env:build with options: ${JSON.stringify(terminalAndExecutorOptions)}`)

  return Promise.resolve({
    success: true,
    command: '????????',
  } satisfies ExecutorOutput);
}
