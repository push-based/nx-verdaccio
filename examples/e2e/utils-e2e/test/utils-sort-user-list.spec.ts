import { basename, dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import {
  executeProcess,
  getTestEnvironmentRoot,
  getTestFixturesDist,
} from '@push-based/test-utils';

// change 1
// change 2

describe('utils - sort user list', () => {
  const fixturesDist = getTestFixturesDist('sort-user-list', {
    root: getTestEnvironmentRoot(process.env['NX_TASK_TARGET_PROJECT']),
  });
  afterEach(async () => {
    await rm(fixturesDist, { recursive: true, force: true });
  });

  it('should sort unsorted user list', async () => {
    const testPath = join(fixturesDist, 'unsorted-list', 'sort-user.ts');
    await mkdir(dirname(testPath), { recursive: true });
    await expect(
      writeFile(
        testPath,
        `
    import {sortUser} from "@push-based/utils";
    console.log(JSON.stringify(sortUser([{name: 'Michael'}, {name: 'Alice'}]), null, 2));`
      )
    ).resolves.not.toThrow();

    const { stdout } = await executeProcess({
      command: 'tsx',
      args: [basename(testPath)],
      cwd: dirname(testPath),
      verbose: true,
    });

    expect(JSON.parse(stdout)).toStrictEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);
  });
});
