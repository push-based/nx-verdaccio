import { join } from 'node:path';

export const DEFAULT_VERDACCIO_STORAGE_DIR = join(
  'tmp',
  'local-registry',
  'storage'
);
export const DEFAULT_ENVIRONMENTS_OUTPUT_DIR = join('tmp', 'environments');
export const NPMRC_FILENAME = '.npmrc';
export const DEFAULT_START_VERDACCIO_TARGET = 'build-env-verdaccio-start';
export const DEFAULT_BOOTSTRAP_TARGET = 'build-env-env-bootstrap';
export const DEFAULT_INSTALL_TARGET = 'build-env-env-install';
export const DEFAULT_NPM_PUBLISH_TARGET = 'build-env-release-publish';
export const DEFAULT_NPM_INSTALL_TARGET = 'build-env-release-install';
export const DEFAULT_SETUP_TARGET = 'build-env-env-setup';
export const DEFAULT_STOP_VERDACCIO_TARGET = 'build-env-verdaccio-stop';
export const DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES = ['e2e'];