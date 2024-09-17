import { basename, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { executeProcess, getTestFixturesDist } from '@push-based/test-utils';
import { readJsonFile } from 'nx/src/utils/fileutils';
import { User } from '@push-based/models';
import { getEnvironmentRoot } from '@push-based/build-env';

describe('core - sort user.json', () => {
  const fixturesDist = getTestFixturesDist('sort-user-json', {
    root: getEnvironmentRoot(),
  });

  afterEach(async () => {
    await rm(fixturesDist, { recursive: true, force: true });
  });

  it('should sort unsorted user json file', async () => {
    const cwd = join(fixturesDist, 'unsorted-json-file');
    const testScriptPath = join(cwd, 'sort-user.ts');
    const testDataPath = join(cwd, 'users.json');

    await mkdir(cwd, { recursive: true });
    await writeFile(
      testDataPath,
      JSON.stringify([{ name: 'Michael' }, { name: 'Alice' }])
    );
    await expect(
      writeFile(
        testScriptPath,
        `
    import {sortUserFile} from "@push-based/core";
    sortUserFile('${basename(testDataPath)}');`
      )
    ).resolves.not.toThrow();

    await executeProcess({
      command: 'tsx',
      args: [basename(testScriptPath)],
      cwd,
      verbose: true,
    });

    const userJson = await readJsonFile<User[]>(testDataPath);
    expect(userJson).toStrictEqual([{ name: 'Alice' }, { name: 'Michael' }]);
  });
});
