import { beforeEach, describe } from 'vitest';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import { isFolderInGit } from './git';
import {
  commitFile,
  initGitRepo,
  teardownTestFolder,
} from '@push-based/test-utils';
import { writeFile } from 'node:fs/promises';

describe('isFolderInGit in a fresh repo', () => {
  const repoRoot = join('tmp', 'integration-test', 'is-folder-in-git');
  let git;

  beforeEach(async () => {
    git = await initGitRepo(simpleGit, { baseDir: repoRoot });
    await commitFile(git, {
      baseDir: repoRoot,
      file: { name: '.gitignore', content: 'tmp.txt' },
      commitMsg: 'Add .gitignore',
    });
    await writeFile(join(repoRoot, 'tmp.txt'), 'Hello!');
    await git.checkout(['main']);
  }, 20_000);

  afterEach(async () => {
    await git.checkout(['main']);
  });

  it('should return true', async () => {
    await expect(isFolderInGit(repoRoot)).resolves.toBe(true);
  });

  it('should return false if ignored', async () => {
    await expect(isFolderInGit(join(repoRoot, 'tmp'))).resolves.toBe(false);
  });
});
