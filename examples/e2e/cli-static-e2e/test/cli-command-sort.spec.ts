import { basename, dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { executeProcess, objectToCliArgs } from '@push-based/test-utils';
import type { SimpleGit } from 'simple-git';
import { simpleGit } from 'simple-git';

describe('CLI command - sort', () => {
  const envRoot = join('static-environments', 'user-lists');
  const baseDir = join(envRoot, 'src', 'lib');
  const gitClient: SimpleGit = simpleGit(process.cwd());

  afterEach(async () => {
    await gitClient.checkout([baseDir]);
    await gitClient.clean('f', [baseDir]);
  });

  it('should execute CLI command sort when param file is given', async () => {
    const testPath = join(baseDir, 'unsorted-users.json');

    const { code } = await executeProcess({
      command: 'npx',
      args: objectToCliArgs({
        _: ['cli', 'sort'],
        filePath: basename(testPath),
      }),
      cwd: dirname(testPath),
      verbose: true,
    });

    expect(code).toBe(0);

    const content = (await readFile(testPath)).toString();
    expect(JSON.parse(content)).toStrictEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);
  });

  it('should execute CLI command sort on sorted file', async () => {
    const testPath = join(baseDir, 'sorted-users.json');

    const contentBefore = (await readFile(testPath)).toString();
    expect(JSON.parse(contentBefore)).toStrictEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);

    const { code } = await executeProcess({
      command: 'npx',
      args: objectToCliArgs({
        _: ['cli', 'sort'],
        filePath: basename(testPath),
      }),
      cwd: baseDir,
    });

    expect(code).toBe(0);

    const content = (await readFile(testPath)).toString();
    expect(JSON.parse(content)).toStrictEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);
  });
});
