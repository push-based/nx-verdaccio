import { join } from 'node:path';

export const PLUGIN_NAME = 'build-env';
export const DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES = ['e2e'];
export const DEFAULT_ENVIRONMENTS_OUTPUT_DIR = join('tmp', 'environments');
