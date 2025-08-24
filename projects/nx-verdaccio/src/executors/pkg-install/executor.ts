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
  const {
    verbose,
    environmentRoot,
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
  const { name: packageName } = readJsonFile<PackageJson>(
    join(packageDistPath, 'package.json')
  );

  logger.info(`Installing ${packageName} in ${environmentRoot}`);

  await executeProcess({
    command: 'npm',
    args: objectToCliArgs({
      _: [
        'install',
        `${packageName}`,
        '--include=prod',
        '--include=peer',
        // @TODO: implement options for dev and optional dependencies
        //'--include=dev',
        //'--include=optional',
      ],
      fund: false, // avoid polluted terminal
      shrinkwrap: false, // avoid package-lock creation or update
      save: true, // save to package.json dependencies
    }),
    cwd: environmentRoot,
    verbose: verbose === false ? false : true,
  });

  return Promise.resolve({
    success: true,
    command: 'Installed dependencies successfully.',
  } satisfies NpmInstallExecutorOutput);
}
