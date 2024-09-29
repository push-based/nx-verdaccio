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
