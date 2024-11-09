import { basename, dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { executeProcess, objectToCliArgs } from '@push-based/test-utils';
import type { SimpleGit } from 'simple-git';
import { simpleGit } from 'simple-git';

describe('CLI command - sort', () => {
  const envRoot = join('static-environments', 'user-lists');
  const baseDir = join(envRoot, 'src', 'lib');
  export const gitClient: SimpleGit = simpleGit(process.cwd());

  afterEach(async () => {
    await gitClient.checkout([envRoot]);
    await gitClient.clean('f', [envRoot]);
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
    expect(JSON.parse(content)).toEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);
  });
});
