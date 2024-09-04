import { basename, dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { executeProcess, getTestFixturesDist } from '@org/test-utils';
import { getEnvironmentRoot } from '@org/build-env';

describe('utils - sort user list', () => {
  const fixturesDist = getTestFixturesDist('sort-user-list', {
    root: getEnvironmentRoot(),
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
    import {sortUser} from "@org/utils";
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
