import { basename, dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { executeProcess, objectToCliArgs } from '@org/test-utils';

describe('CLI command - sort', () => {
  const workspaceRoot = join('tmp', 'npm-env', 'cli-e2e-env');
  const baseDir = join(workspaceRoot, '__test_env__', 'cli-command-sort');

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should execute CLI command sort when param file is given', async () => {
    const testPath = join(baseDir, 'execute-sort-command', 'users.json');
    await mkdir(dirname(testPath), { recursive: true });
    await writeFile(
      testPath,
      JSON.stringify([{ name: 'Michael' }, { name: 'Alice' }])
    );

    const { code } = await executeProcess({
      command: 'npx',
      args: objectToCliArgs({
        _: ['@org/cli', 'sort'],
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
