import { logger, type ExecutorContext } from '@nx/devkit';

import type { NpmPublishExecutorOptions } from './schema';
import { join, relative } from 'node:path';
import { executeProcess } from '../../internal/utils/execute-process';
import { objectToCliArgs } from '../../internal/utils/terminal-command';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../../internal/constants';
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

  return Promise.resolve({
    success: true,
    command: 'Published package successfully.',
  } satisfies NpmPublishExecutorOutput);
}
