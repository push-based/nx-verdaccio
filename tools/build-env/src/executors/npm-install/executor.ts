import {
  type ExecutorContext,
  readJsonFile,
  type TargetConfiguration,
} from '@nx/devkit';

import type { NpmInstallExecutorOptions } from './schema';
import { join, relative } from 'node:path';
import { executeProcess } from '../../internal/utils/execute-process';
import { objectToCliArgs } from '../../internal/utils/terminal-command';
import { PackageJson } from 'nx/src/utils/package-json';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../../internal/constants';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

const relativeFromPath = (dir: string) =>
  relative(join(process.cwd(), dir), join(process.cwd()));

export default async function runNpmInstallExecutor(
  terminalAndExecutorOptions: NpmInstallExecutorOptions,
  context: ExecutorContext
) {
  const { projectName, projectsConfigurations } = context;
  const { environmentProject = projectName, pkgVersion } =
    terminalAndExecutorOptions;
  // @TODO DEFAULT_ENVIRONMENTS_OUTPUT_DIR is configured in the registered plugin thing about how to get that value
  const environmentRoot = join(
    DEFAULT_ENVIRONMENTS_OUTPUT_DIR,
    environmentProject
  );
  const packageDistPath = getBuildOutput(projectsConfigurations[projectName]);

  const { name: packageName, version } = readJsonFile<PackageJson>(
    join(packageDistPath, 'package.json')
  );
  const userconfig = relativeFromPath(
    join(packageDistPath, environmentRoot, '.npmrc')
  );

  await executeProcess({
    command: 'npm',
    args: objectToCliArgs({
      _: ['install', `${packageName}@${pkgVersion ?? version}`],
      'no-fund': true,
      'no-shrinkwrap': true,
      save: true,
      prefix: environmentRoot,
      userconfig,
    }),
    cwd: process.cwd(),
    verbose: true,
  });

  return Promise.resolve({
    success: true,
    command: 'Installed dependencies successfully.',
  } satisfies ExecutorOutput);
}

function getBuildOutput(target: TargetConfiguration) {
  const { options } = target ?? {};
  const { outputPath } = options ?? {};
  if (!outputPath) {
    throw new Error('outputPath is required');
  }
  return outputPath;
}
