import { executeProcess } from '@org/test-utils';
import { NpmTestEnvResult, startNpmEnv } from '../../../tools/utils/env';
import { join, relative } from 'node:path';
import { rm } from 'node:fs/promises';

const isVerbose: boolean = process.env.NX_VERBOSE_LOGGING === 'true' ?? false;
const teardownEnv: boolean = process.env.E2E_TEARDOWN_ENV !== 'false';

let activeRegistry: NpmTestEnvResult;
const projectName = process.env['NX_TASK_TARGET_PROJECT'];
let stopRegistry;

export async function setup() {
  // start registry
  activeRegistry = await startNpmEnv({
    projectName,
    workspaceRoot: join('tmp', 'e2e', projectName),
    targetName: 'start-verdaccio',
    verbose: isVerbose,
    clear: true,
  });

  const { registry, workspaceRoot, stop } = activeRegistry;
  stopRegistry = stop;

  const { url } = registry;
  const userconfig = join(workspaceRoot, '.npmrc');
  // package publish all projects
  await executeProcess({
    command: 'nx',
    args: ['run-many', '-t=npm-publish', `--userconfig=${userconfig}`],
    observer: {
      onStdout: (stdout) => {
        if (isVerbose) {
          console.info(stdout);
        }
      },
      onStderr: (stdout) => {
        if (isVerbose) {
          console.error(stdout);
        }
      },
    },
  });

  // package install all projects to test env folder
  await executeProcess({
    command: 'nx',
    args: ['run-many', '-t=npm-install', `--prefix=${workspaceRoot}`],
    observer: {
      onStdout: (stdout) => {
        if (isVerbose) {
          console.info(stdout);
        }
      },
      onStderr: (stdout) => {
        if (isVerbose) {
          console.error(stdout);
        }
      },
    },
  });
}

export async function teardown() {
  stopRegistry();
  // teardownEnv && await rm(activeRegistry.workspaceRoot, {recursive: true, force: true});
}
