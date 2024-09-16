import { basename, dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { executeProcess, getTestFixturesDist } from '@push-based/test-utils';
import { getEnvironmentRoot } from '@push-based/build-env';

describe('models - parse user', () => {
  const fixturesDist = getTestFixturesDist('parse-user', {
    root: getEnvironmentRoot(),
  });

  afterEach(async () => {
    await rm(fixturesDist, { recursive: true, force: true });
  });

  it('should parse valid user data', async () => {
    const testPath = join(fixturesDist, 'valid-user', 'parse-user.ts');
    await mkdir(dirname(testPath), { recursive: true });
    await expect(
      writeFile(
        testPath,
        `
    import {parseUser} from "@push-based/models";
    console.log(JSON.stringify(parseUser({name: 'Alice', color: 'green'}), null, 2));`
      )
    ).resolves.not.toThrow();

    const { stdout } = await executeProcess({
      command: 'tsx',
      args: [basename(testPath)],
      cwd: dirname(testPath),
      verbose: true,
    });

    expect(JSON.parse(stdout)).toStrictEqual({ name: 'Alice' });
  });
});
