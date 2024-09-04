import { type ExecutorContext, logger } from '@nx/devkit';

import type { NpmPublishExecutorOptions } from './schema';
import { join, relative } from 'node:path';
import { executeProcess } from '../../internal/utils/execute-process';
import { objectToCliArgs } from '../../internal/utils/terminal-command';
import { getBuildOutput } from '../../internal/utils/utils';
import { normalizeOptions } from '../internal/normalize-options';

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
    projectName,
    projectsConfigurations,
    options: opt,
  } = normalizeOptions(context, options);
  const { environmentRoot } = opt;

  const { targets } = projectsConfigurations.projects[projectName];
  const packageDistPath = getBuildOutput(targets['build']);
  const userconfig = join(
    relativeFromDist(packageDistPath),
    join(environmentRoot, '.npmrc')
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
