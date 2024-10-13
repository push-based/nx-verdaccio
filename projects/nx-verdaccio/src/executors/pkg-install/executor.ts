import { type ExecutorContext, logger, readJsonFile } from '@nx/devkit';
import type { NpmInstallExecutorOptions } from './schema';
import { join } from 'node:path';
import { executeProcess } from '../../internal/execute-process';
import { objectToCliArgs } from '../../internal/terminal';
import type { PackageJson } from 'nx/src/utils/package-json';
import { getTargetOutputPath } from '../../internal/target';

export type NpmInstallExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runNpmInstallExecutor(
  options: NpmInstallExecutorOptions,
  context: ExecutorContext
) {
  const { projectName, projectsConfigurations } = context;

  const packageDistPath = getTargetOutputPath(
    projectsConfigurations.projects[projectName]?.targets['build']
  );
  const { name: packageName, version } = readJsonFile<PackageJson>(
    join(packageDistPath, 'package.json')
  );
  const { environmentRoot } = options;
  const packageNameAndVersion = `${packageName}@${version}`;

  logger.info(`Installing ${packageNameAndVersion} in ${environmentRoot}`);

  await executeProcess({
    command: 'npm',
    args: objectToCliArgs({
      _: ['install', `${packageNameAndVersion}`],
      fund: false, // avoid polluted terminal
      shrinkwrap: false, // avoid package-lock creation or update
      save: true, // save to package.json dependencies
    }),
    cwd: environmentRoot,
    verbose: true,
  });

  return Promise.resolve({
    success: true,
    command: 'Installed dependencies successfully.',
  } satisfies NpmInstallExecutorOutput);
}
