import { setup } from './setup.ts';
import { REPO_NAME } from './config.ts';
import { join } from 'node:path';
import {
  DEFAULT_TEST_FIXTURE_DIST,
  getTestEnvironmentRoot,
  teardownTestFolder,
} from '@push-based/test-utils';

export const projectName = 'cli-post-script-e2e';
const envRoot = getTestEnvironmentRoot(projectName);
export const repoPath = join(envRoot, DEFAULT_TEST_FIXTURE_DIST, REPO_NAME);

(async () => {
  // clean up previous runs
  await teardownTestFolder(repoPath);
  await setup({ envRoot: repoPath, repoName: REPO_NAME, projectName });
})();
