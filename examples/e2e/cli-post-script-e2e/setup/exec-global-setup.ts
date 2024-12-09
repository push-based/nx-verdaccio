import { setup } from './setup.ts';
import { REPO_NAME } from './config.ts';
import { join } from 'node:path';
import {
  DEFAULT_TEST_FIXTURE_DIST,
  getTestEnvironmentRoot,
} from '@push-based/test-utils';

export const projectName = 'cli-post-script-e2e';
export const repoPath = join(
  getTestEnvironmentRoot(projectName),
  DEFAULT_TEST_FIXTURE_DIST,
  REPO_NAME
);

(async () => await setup(repoPath, REPO_NAME, projectName))();
