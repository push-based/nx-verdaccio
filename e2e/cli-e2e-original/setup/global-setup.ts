import { executeProcess, objectToCliArgs } from '@org/test-utils';
import {
  startVerdaccioServer,
  VercaddioServerResult,
} from '../../../tools/utils/registry';
import { rm } from 'node:fs/promises';
import {
  configureRegistry,
  unconfigureRegistry,
} from '../../../tools/utils/npm';
import * as process from "process";

const isVerbose: boolean = true; // process.env.NX_VERBOSE_LOGGING === 'true' ?? false;

let activeRegistry: VercaddioServerResult;
let stopRegistry: () => void;

export async function setup() {
  // start Verdaccio server and setup local registry storage
  const { stop, registry } = await startVerdaccioServer({
    targetName: 'local-registry',
    verbose: isVerbose,
  });
  activeRegistry = registry;
  stopRegistry = stop;

  // configure env with verdaccio registry as default
  // exec commands:
  // - `npm config set registry "${url}"`
  // - `npm config set //${host}:${port}/:_authToken "secretVerdaccioToken"`
  configureRegistry(registry, isVerbose);

  // package publish all projects
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({ _: ['run-many'], targets: 'nx-release-publish,!tag:type:testing', exclude: 'tag:type:testing', skipNxCache: true }),
    verbose: isVerbose,
  });

  // package install all projects
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({ _: ['run-many'], targets: 'original-npm-install', force: true, exclude: 'tag:type:testing', skipNxCache: true}),
    verbose: isVerbose,
  });
}
/*
export async function teardown() {
  // uninstall all projects
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['run-many'],
      targets: 'original-npm-uninstall',
    }),
    verbose: isVerbose,
  });
  // stopRegistry();
  // exec commands:
  // - `npm config delete //${host}:${port}/:_authToken`
  // - `npm config delete registry`
  // unconfigureRegistry(activeRegistry, isVerbose);
  // await rm(activeRegistry.storage, {recursive: true, force: true});
}
*/
