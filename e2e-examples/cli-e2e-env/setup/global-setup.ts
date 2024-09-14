import { executeProcess, objectToCliArgs } from '@org/test-utils';
import { NpmTestEnvResult } from '@org/tools-utils';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import { readJsonFile } from '@nx/devkit';

// DEBUG FLAGS
const isVerbose = true; // process.env.NX_VERBOSE_LOGGING === 'true' ?? false;
const teardownEnv = true; //process.env.E2E_TEARDOWN_ENV !== 'false';
const teardownRegistry = true; //process.env.E2E_TEARDOWN_REGISTRY !== 'false';

let activeRegistry: NpmTestEnvResult;
const projectName = process.env['NX_TASK_TARGET_PROJECT'];

let stopRegistry: () => void;

export async function setup() {
  if (projectName == null) {
    throw new Error('Project Name required.');
  }
  // start registry
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['env-setup-npm-env', projectName ?? ''],
      verbose: isVerbose,
      clear: true,
      readyWhen: 'Environment ready under',
    }),
    verbose: isVerbose,
    shell: true,
  });

  const workspaceRoot = join('tmp', 'environments', projectName);
  activeRegistry = await readJsonFile(
    join(workspaceRoot, 'verdaccio-registry.json')
  );
  const { registry } = activeRegistry;
  stopRegistry = () => process.kill(Number(registry?.pid));

  // package publish all projects
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['run-many', '-t=env-npm-publish'],
      verbose: isVerbose,
      envProjectName: projectName,
    }),
    verbose: isVerbose,
  });

  // package install all projects to test env folder
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['run-many', '-t=env-npm-install'],
      verbose: isVerbose,
      envProjectName: projectName,
    }),
    verbose: isVerbose,
  });
}

export async function teardown() {
  if (teardownRegistry) {
    stopRegistry();
  }
  if (teardownEnv) {
    await rm(activeRegistry.workspaceRoot, { recursive: true, force: true });
  }
}
