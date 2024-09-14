import { rm } from 'node:fs/promises';
import { executeProcess, objectToCliArgs } from '@org/test-utils';
import {
  configureRegistry,
  RegistryResult,
  startVerdaccioServer,
  unconfigureRegistry,
} from '@org/tools-utils';

const isVerbose = process.env['NX_VERBOSE_LOGGING'] === 'true' ?? false;
const projectName = process.env['NX_TASK_TARGET_PROJECT'];

export async function setup() {
  if (projectName == null) {
    throw new Error('Project name required.');
  }

  const registryResult = await startVerdaccioServer({
    targetName: 'original-local-registry',
    verbose: isVerbose,
    clear: true,
  });

  configureRegistry(registryResult.registry, isVerbose);

  // package publish all projects
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['run-many'],
      targets: 'original-npm-publish',
      exclude: 'tag:type:testing',
      skipNxCache: true,
      verbose: isVerbose,
    }),
    verbose: isVerbose,
  });

  // package install all projects
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['run-many'],
      targets: 'original-npm-install',
      exclude: 'tag:type:testing',
      parallel: 1,
      skipNxCache: true,
      verbose: isVerbose,
    }),
    verbose: isVerbose,
  });

  // @TODO figure out why named exports don't work https://vitest.dev/config/#globalsetup
  return () => teardownSetup(registryResult);
}

export async function teardownSetup({ registry, stop }: RegistryResult) {
  console.info(`Teardown ${projectName}`);
  // uninstall all projects
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['run-many'],
      targets: 'original-npm-uninstall',
    }),
    verbose: isVerbose,
  });

  stop();
  unconfigureRegistry(registry, isVerbose);
  await rm(registry.storage, { recursive: true, force: true });
  await rm('local-registry', { recursive: true, force: true });
}
