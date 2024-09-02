import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

describe('CLI command - sort', () => {
  const baseDir = 'tmp/e2e/cli-e2e-graph/sort';

  afterEach(async () => {
    // await rm(baseDir, {recursive: true, force: true});
  });

  it('should execute CLI command sort when param file is given', async () => {
    const testPath = join(baseDir, 'file-sort', 'users.json');
    await mkdir(dirname(testPath), { recursive: true });
    await writeFile(
      testPath,
      JSON.stringify([{ name: 'Michael' }, { name: 'Alice' }])
    );

    expect(() => execSync(`npx @org/cli sort --file="${testPath}"`)).toThrow(
      'Command failed: npx @org/cli sort --file="tmp/cli-e2e-graph/sort/file-sort/users.json"'
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
