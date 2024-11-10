import { dirname, join, basename } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { executeProcess, objectToCliArgs } from '@push-based/test-utils';
import {
  getTestFixturesDist,
  getTestEnvironmentRoot,
} from '@push-based/test-utils';

describe('CLI command - sort -p plugin-1', () => {
  const fixturesDist = getTestFixturesDist('cli-command-sort', {
    root: getTestEnvironmentRoot(process.env['NX_TASK_TARGET_PROJECT']),
  });

  afterEach(async () => {
    await rm(fixturesDist, { recursive: true, force: true });
  });

  it('should execute CLI command sort when param file is given', async () => {
    const testPath = join(
      fixturesDist,
      'execute-sort-command-with-plugin',
      'users.json'
    );
    await mkdir(dirname(testPath), { recursive: true });
    await writeFile(
      testPath,
      JSON.stringify([{ name: 'B' }, { name: 'A' }, { name: 'C' }])
    );

    const { code } = await executeProcess({
      command: 'npx',
      args: objectToCliArgs({
        _: ['cli', 'sort', '-p @push-based/plugin-1'],
        filePath: basename(testPath),
      }),
      cwd: dirname(testPath),
      verbose: true,
    });

    expect(code).toBe(0);

    const content = (await readFile(testPath)).toString();
    expect(JSON.parse(content)).toStrictEqual([
      { name: 'C' },
      { name: 'B' },
      { name: 'A' },
    ]);
  });
});
