import { type ExecutorContext, logger } from '@nx/devkit';
import type { BootstrapExecutorOptions } from './schema';
import { bootstrapEnvironment } from './bootstrap-env';
import { normalizeOptions } from '../internal/normalize-options';

export type BootstrapExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runBootstrapExecutor(
  options: BootstrapExecutorOptions,
  context: ExecutorContext
) {
  const { projectName, options: normalizedOptions } = normalizeOptions(
    context,
    options
  );
  logger.info(
    `Execute @org/build-env:bootstrap with options: ${JSON.stringify(
      options,
      null,
      2
    )}`
  );

  try {
    await bootstrapEnvironment({
      ...normalizedOptions,
      projectName,
      readyWhen: 'Environment ready under',
    });
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      command: error,
    };
  }

  return Promise.resolve({
    success: true,
    command: 'Bootstraped environment successfully.',
  } satisfies BootstrapExecutorOutput);
}
