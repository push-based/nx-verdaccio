import { join } from 'node:path';
import { name } from '../../package.json';

export const PACKAGE_NAME = name;
export const PLUGIN_NAME = 'nx-verdaccio';
export const DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES = ['e2e'];
export const DEFAULT_ENVIRONMENTS_OUTPUT_DIR = join('tmp', 'environments');

export const DEFAULT_VERDACCIO_STORAGE_DIR = join(
  'tmp',
  'local-registry',
  'storage'
);

export const DEFAULT_ENVIRONMENT_TARGETS = {
  bootstrap: 'nxv-env-bootstrap',
  install: 'nxv-env-install',
  publishOnly: 'nxv-env-publish-only',
  setup: 'nxv-env-setup',
  teardown: 'nxv-env-teardown',
  e2e: 'nxv-e2e',
  verdaccioStart: 'nxv-verdaccio-start',
  verdaccioStop: 'nxv-verdaccio-stop',
} as const;

export type NxVerdaccioEnvironmentTarget =
  keyof typeof DEFAULT_ENVIRONMENT_TARGETS;

export const DEFAULT_PACKAGE_TARGETS = {
  install: 'nxv-pkg-install',
  publish: 'nxv-pkg-publish',
} as const;

export type NxVerdaccioPackageTarget = keyof typeof DEFAULT_PACKAGE_TARGETS;
