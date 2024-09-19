import { type ExecutorContext, logger } from '@nx/devkit';

import type { NpmPublishExecutorOptions } from './schema';
import { join, relative } from 'node:path';
import { executeProcess } from '../../internal/execute-process';
import { objectToCliArgs } from '../../internal/terminal';
import { getTargetOutputPath } from '../../internal/target';
import { normalizeExecutorOptions } from '../internal/normalize-options';
import { NPMRC_FILENAME } from '../../internal/constants';
import * as process from 'process';

export type NpmPublishExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

const relativeFromDist = (dir: string) =>
  relative(join(process.cwd(), dir), join(process.cwd()));

export default async function runNpmPublishExecutor(
  options: NpmPublishExecutorOptions,
  context: ExecutorContext
) {
  const normalizedOptions = normalizeExecutorOptions(context, options);
  const { projectsConfigurations, options: parsedOptions } = normalizedOptions;
  const { environmentRoot } = parsedOptions;

  const { projectName } = context;
  const { targets } = projectsConfigurations.projects[projectName];
  const packageDistPath = getTargetOutputPath(targets['build']);
  const userconfig = join(
    relativeFromDist(packageDistPath),
    join(environmentRoot, NPMRC_FILENAME)
  );

  logger.info(
    `Publishing package from ${packageDistPath} to ${environmentRoot} with userconfig ${userconfig}`
  );
  try {
    // @TODO: try leverage nx-release-publish
    await executeProcess({
      command: 'npm',
      args: objectToCliArgs({
        _: ['publish'],
        userconfig,
      }),
      cwd: packageDistPath,
      verbose: true,
    });
  } catch (error) {
    // if package already exists, log and go on
    if (error.message.includes('EPUBLISHCONFLICT')) {
      logger.warn(`Package for ${projectName} already published. Proceeding.`);
      return {
        success: false,
        command: error,
      };
    } else {
      throw error;
    }
  }

  return Promise.resolve({
    success: true,
    command: 'Published package successfully.',
  } satisfies NpmPublishExecutorOutput);
}
