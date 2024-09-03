import { type ExecutorContext, logger } from '@nx/devkit';
import type { BuildExecutorOptions } from './schema';
import { setupNpmEnv } from '../../internal/verdaccio/verdaccio-npm-env';
import { join } from 'node:path';
import * as process from 'process';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runBuildExecutor(
  terminalAndExecutorOptions: BuildExecutorOptions,
  context: ExecutorContext
) {
  const { projectName } = context;
  const normalizedOptions = {
    ...terminalAndExecutorOptions,
    workspaceRoot: join('tmp', 'environments', projectName),
  };
  logger.info(
    `Execute @org/build-env:build with options: ${JSON.stringify(
      terminalAndExecutorOptions,
      null,
      2
    )}`
  );

  let envResult;
  try {
    envResult = await setupNpmEnv({
      ...normalizedOptions,
      projectName,
      readyWhen: 'Environment ready under',
    });
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
    command: JSON.stringify(envResult, null, 2),
  } satisfies ExecutorOutput);
}
