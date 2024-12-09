import {
  DEFAULT_TEST_FIXTURE_DIST,
  executeProcess,
  getTestEnvironmentRoot,
  objectToCliArgs,
  teardownTestFolder,
} from '@push-based/test-utils';
import { join } from 'node:path';
import { REPO_NAME } from './config';
import { copyFile, mkdir } from 'node:fs/promises';

const projectName = process.env['NX_TASK_TARGET_PROJECT'];
export const repoPath = join(
  getTestEnvironmentRoot(projectName),
  DEFAULT_TEST_FIXTURE_DIST,
  repoName
);

export default async function vitestGlobalSetup() {
  // clean
  teardownTestFolder(repoPath);

  // setup nx environment for e2e tests
  setup(repoPath, repoName, projectName);

  return () => {
    return teardownTestFolder(repoPath);
  };
}
