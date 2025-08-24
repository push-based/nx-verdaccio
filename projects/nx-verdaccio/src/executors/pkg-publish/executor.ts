import { type ExecutorContext, logger } from '@nx/devkit';

import type { NpmPublishExecutorOptions } from './schema';
import { join, relative } from 'node:path';
import { executeProcess } from '../../internal/execute-process';
import { objectToCliArgs } from '../../internal/terminal';
import { getTargetOutputPath } from '../../internal/target';
import { NPMRC_FILENAME } from './constants';
import * as process from 'process';
import { markPackageJson } from './pkg-version';

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
  const {
    environmentRoot,
    verbose,
    releaseTarget = 'build',
    optionsOutputPathKey = 'outputPath',
  } = options;

  const { projectName } = context;
  const packageDistPath = getTargetOutputPath(
    {
      project: projectName,
      target: releaseTarget,
      optionsKey: optionsOutputPathKey,
    },
    context
  );
  logger.info(`Publishing package from ${environmentRoot}`);
  const userconfig = join(
    relativeFromDist(packageDistPath),
    join(environmentRoot, NPMRC_FILENAME)
  );

  logger.info(
    `Publishing package from ${packageDistPath} to ${environmentRoot} with userconfig ${userconfig}`
  );

  await markPackageJson(packageDistPath);

  try {
    // @TODO: try leverage nx-release-publish
    await executeProcess({
      command: 'npm',
      args: objectToCliArgs({
        _: ['publish'],
        userconfig,
      }),
      cwd: packageDistPath,
      verbose,
    });
  } catch (error) {
    // if package already exists, log and go on
    if (error.message.includes('EPUBLISHCONFLICT')) {
      logger.warn(`Package for ${projectName} already published.`);
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
