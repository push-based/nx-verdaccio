import {executeProcess, objectToCliArgs} from '@org/test-utils';
import {NpmTestEnvResult} from '../../../tools/utils/env';
import {rm} from 'node:fs/promises';

// DEBUG FLAGS
const isVerbose: boolean = true; // process.env.NX_VERBOSE_LOGGING === 'true' ?? false;
const teardownEnv: boolean = true; //process.env.E2E_TEARDOWN_ENV !== 'false';
const teardownRegistry: boolean = true; //process.env.E2E_TEARDOWN_REGISTRY !== 'false';

let activeRegistry: NpmTestEnvResult;
const projectName = process.env['NX_TASK_TARGET_PROJECT'];
let stopRegistry;

export async function setup() {
  // start registry
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['graph-setup-npm-env', projectName ?? ''],
      verbose: isVerbose,
    }),
    verbose: isVerbose,
    shell: true,
  });

  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['graph-install-npm-env', projectName ?? ''],
      verbose: isVerbose,
      envProjectName: projectName,
    }),
    verbose: isVerbose,
    shell: true,
  });
}

export async function teardown() {
  stopRegistry();
  if (teardownRegistry) {
  }
  await rm(activeRegistry.workspaceRoot, { recursive: true, force: true });
  if (teardownEnv) {
  }
}
