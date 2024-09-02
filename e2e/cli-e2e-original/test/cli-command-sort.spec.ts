import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { executeProcess, objectToCliArgs } from '@org/test-utils';

describe('CLI command - sort', () => {
  const workspaceRoot = join('tmp', 'cli-e2e-original');
  const baseDir = join(workspaceRoot, 'cli-command-sort');

  afterEach(async () => {
    // await rm(baseDir, {recursive: true, force: true});
  });

  it('should execute CLI command sort when param file is given', async () => {
    const testPath = join(baseDir, 'execute-sort-command', 'users.json');
    await mkdir(dirname(testPath), { recursive: true });
    await writeFile(
      testPath,
      JSON.stringify([{ name: 'Michael' }, { name: 'Alice' }])
    );

    await expect(
      executeProcess({
        command: 'npx',
        args: objectToCliArgs({
          _: ['@org/cli', 'sort'],
          file: testPath,
        }),
        verbose: true,
      })
    ).rejects.toThrow(
      'The "path" argument must be of type string or an instance of Buffer or URL'
    );
    /*
        const content = (await readFile(testPath)).toString();
        expect(JSON.parse(content)).toEqual([
          {name: 'Alice'},
          {name: 'Michael'},
        ]);
    */
  });
});
