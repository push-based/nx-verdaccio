import { type ExecutorContext, logger, readJsonFile } from '@nx/devkit';

import type { NpmInstallExecutorOptions } from './schema';
import { join } from 'node:path';
import { executeProcess } from '../../internal/utils/execute-process';
import { objectToCliArgs } from '../../internal/utils/terminal-command';
import type { PackageJson } from 'nx/src/utils/package-json';
import { getBuildOutput } from '../../internal/utils/utils';
import { normalizeOptions } from '../internal/normalize-options';

export type NpmInstallExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runNpmInstallExecutor(
  options: NpmInstallExecutorOptions,
  context: ExecutorContext
) {
  const {
    projectName,
    projectsConfigurations,
    options: opt,
  } = normalizeOptions(context, options);

  const packageDistPath = getBuildOutput(
    projectsConfigurations.projects[projectName]?.targets['build']
  );
  const { name: packageName, version } = readJsonFile<PackageJson>(
    join(packageDistPath, 'package.json')
  );
  const { pkgVersion = version, environmentRoot } = opt;

  logger.info(`Installing ${packageName}@${pkgVersion} in ${environmentRoot}`);

  await executeProcess({
    command: 'npm',
    args: objectToCliArgs({
      _: ['install', `${packageName}@${pkgVersion}`],
      'no-fund': true,
      'no-shrinkwrap': true,
      save: true,
      prefix: environmentRoot,
      userconfig: join(environmentRoot, '.npmrc'),
    }),
    verbose: true,
  });

  return Promise.resolve({
    success: true,
    command: 'Installed dependencies successfully.',
  } satisfies NpmInstallExecutorOutput);
}
