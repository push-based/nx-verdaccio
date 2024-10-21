import { rm } from 'node:fs/promises';
import { executeProcess, objectToCliArgs } from '@push-based/test-utils';
import {
  RegistryResult,
  startVerdaccioServer,
} from '../tooling/utils/verdaccio-registry';
import {
  configureRegistry,
  unconfigureRegistry,
} from '../tooling/utils/verdaccio-npm-env';

const isVerbose = process.env['NX_VERBOSE_LOGGING'] === 'true' ?? false;
const projectName = process.env['NX_TASK_TARGET_PROJECT'];
let registryResult: RegistryResult;
let stopFn: () => void;

export async function setup() {
  if (projectName == null) {
    throw new Error('Project name required.');
  }
  console.info(`Set up ${projectName}`);

  registryResult = await startVerdaccioServer({
    targetName: 'original-local-registry',
    verbose: isVerbose,
    clear: true,
  });

  configureRegistry(registryResult.registry, isVerbose);

  // package publish all projects
  await executeProcess({
    command: 'npx',
    args: objectToCliArgs({
      _: ['nx', 'run-many'],
      targets: 'original-npm-publish',
      exclude: 'tag:type:testing',
      skipNxCache: true,
      projects: 'tag:type:example',
      verbose: isVerbose,
    }),
    verbose: isVerbose,
  });

  // package install all projects
  await executeProcess({
    command: 'npx',
    args: objectToCliArgs({
      _: ['nx', 'run-many'],
      targets: 'original-npm-install',
      exclude: 'tag:type:testing',
      skipNxCache: true,
      parallel: 1, // can't run parallel
      verbose: isVerbose,
    }),
    verbose: isVerbose,
  });
}

export async function teardown() {
  console.info(`Teardown ${projectName}`);
  const { registry, stop } = registryResult;
  // uninstall all projects
  await executeProcess({
    command: 'NX_DAEMON=false nx',
    args: objectToCliArgs({
      _: ['run-many'],
      targets: 'original-npm-uninstall',
      parallel: 1,
    }),
    verbose: isVerbose,
  });

  stop();
  unconfigureRegistry(registry, isVerbose);
  await rm(registry.storage, { recursive: true, force: true });
  await rm('local-registry', { recursive: true, force: true });
}
