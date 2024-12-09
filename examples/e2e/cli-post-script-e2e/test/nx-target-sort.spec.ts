import { basename, dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  DEFAULT_TEST_FIXTURE_DIST,
  executeProcess,
  getTestEnvironmentRoot,
  objectToCliArgs,
} from '@push-based/test-utils';
import { REPO_NAME } from '../setup/config';

describe('Nx target - sort', () => {
  const projectName = 'cli-post-script-e2e';
  const envRoot = getTestEnvironmentRoot(projectName);
  const repoRoot = join(envRoot, DEFAULT_TEST_FIXTURE_DIST, REPO_NAME);

  it('should execute Nx target in nx@v19 setup', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: objectToCliArgs({
        _: ['nx', 'run', `${REPO_NAME}:sort`],
      }),
      cwd: repoRoot,
      verbose: true,
    });

    expect(code).toBe(0);
    expect(stdout).toContain('Sorted users in users.json');

    const content = (await readFile(join(repoRoot, 'users.json'))).toString();
    expect(JSON.parse(content)).toStrictEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);
  });
});
