import { executeProcess, objectToCliArgs } from '@org/test-utils';
import { NpmTestEnvResult } from '../../../tools/utils/env';
import { join, relative } from 'node:path';
import { rm } from 'node:fs/promises';
import { VerdaccioExecuterOptions } from '../../../tools/utils/registry';
import { readJsonFile } from '@nx/devkit';

const isVerbose: boolean = process.env.NX_VERBOSE_LOGGING === 'true' ?? false;
const teardownEnv: boolean = process.env.E2E_TEARDOWN_ENV !== 'false';

let activeRegistry: NpmTestEnvResult;
const projectName = process.env['NX_TASK_TARGET_PROJECT'];
let stopRegistry;

export async function setup() {
  // start registry
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs<
      Partial<
        VerdaccioExecuterOptions & {
          _: string[];
          verbose: boolean;
          cwd: string;
        }
      >
    >({
      _: ['start-verdaccio', projectName ?? ''],
      workspaceRoot: join('tmp', 'npm-env', projectName),
      verbose: isVerbose,
      clear: true,
    }),
    shell: true,
  });

  activeRegistry = await readJsonFile(
    join('tmp', 'npm-env', projectName, 'verdaccio-registry.json')
  );
  const { registry, workspaceRoot, stop } = activeRegistry;
  stopRegistry = process.kill(Number(registry.pid));

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
  const s = readJsonFile('');
  stopRegistry();
  teardownEnv &&
    (await rm(activeRegistry.workspaceRoot, { recursive: true, force: true }));
}
