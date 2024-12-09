import { basename, dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  executeProcess,
  objectToCliArgs,
  getTestEnvironmentRoot,
  DEFAULT_TEST_FIXTURE_DIST,
} from '@push-based/test-utils';

describe('Nx target - sort', () => {
  const projectName = 'cli-custom-install-e2e';
  const envRoot = getTestEnvironmentRoot(projectName);
  const repoRoot = join(envRoot, DEFAULT_TEST_FIXTURE_DIST, 'nx-ts-repo');

  it('should execute Nx target in nx@v19 setup', async () => {
    const testPath = join(repoRoot, 'users.json');
    await mkdir(dirname(testPath), { recursive: true });
    await writeFile(
      testPath,
      JSON.stringify([{ name: 'Michael' }, { name: 'Alice' }])
    );
    const { code } = await executeProcess({
      command: 'npx',
      args: objectToCliArgs({
        _: ['nx', 'sort'],
        filePath: testPath,
      }),
      cwd: repoRoot,
      verbose: true,
    });

    expect(code).toBe(0); /**/
    /*
    const content = (await readFile(testPath)).toString();
    expect(JSON.parse(content)).toStrictEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);*/
  });
});
