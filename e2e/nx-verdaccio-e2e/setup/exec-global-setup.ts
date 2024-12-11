import { setup } from './setup.ts';
import { REPO_NAME } from '../fixtures/basic-nx-workspace';
import { join } from 'node:path';
import {
  DEFAULT_TEST_FIXTURE_DIST,
  getTestEnvironmentRoot,
  teardownTestFolder,
} from '@push-based/test-utils';

(async () => {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const envRoot = getTestEnvironmentRoot(projectName);
  const repoPath = join(envRoot, DEFAULT_TEST_FIXTURE_DIST, REPO_NAME);

  // clean up previous runs
  await teardownTestFolder(repoPath);
  await setup({ envRoot: repoPath, repoName: REPO_NAME, projectName });
})();
