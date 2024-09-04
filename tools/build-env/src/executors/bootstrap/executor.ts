import { type ExecutorContext, logger } from '@nx/devkit';
import type { BootstrapExecutorOptions } from './schema';
import { bootstrapEnvironment } from '../../internal/verdaccio/verdaccio-npm-env';
import { join } from 'node:path';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../../internal/constants';

export type BootstrapExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runBootstrapExecutor(
  terminalAndExecutorOptions: BootstrapExecutorOptions,
  context: ExecutorContext
) {
  const { projectName } = context;
  const normalizedOptions = {
    ...terminalAndExecutorOptions,
    environmentRoot: join(DEFAULT_ENVIRONMENTS_OUTPUT_DIR, projectName),
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
    envResult = await bootstrapEnvironment({
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
  } satisfies BootstrapExecutorOutput);
}
