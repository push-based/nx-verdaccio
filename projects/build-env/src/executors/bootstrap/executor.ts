import {type ExecutorContext, logger} from '@nx/devkit';
import type {BootstrapExecutorOptions} from './schema';
import {bootstrapEnvironment} from './bootstrap-env';
import {normalizeExecutorOptions} from '../internal/normalize-options';

export type BootstrapExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runBootstrapExecutor(
  options: BootstrapExecutorOptions,
  context: ExecutorContext
) {
  const { options: normalizedOptions} = normalizeExecutorOptions(
    context,
    options
  );
  context.projectName

  logger.info(
    `Execute @push-based/build-env:bootstrap with options: ${JSON.stringify(
      options,
      null,
      2
    )}`
  );


  try {
    await bootstrapEnvironment({
      ...normalizedOptions
    }, context);
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      command: error,
    };
  }

  return Promise.resolve({
    success: true,
    command: 'Bootstraped environemnt successfully.',
  } satisfies BootstrapExecutorOutput);
}
