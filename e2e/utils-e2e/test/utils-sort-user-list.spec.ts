import {basename, dirname, join} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {mkdir, writeFile, rm} from 'node:fs/promises';
import {executeProcess} from "@org/test-utils";
import {sortUser} from "@org/utils";

describe('utils - sort user list', () => {
  const workspaceRoot = join('tmp', 'npm-env', 'utils-e2e');
  const baseDir = join(workspaceRoot, '__test_env__', 'sort-user-list');

  afterEach(async () => {
    await rm(baseDir, {recursive: true, force: true});
  });

  it('should sort unsorted user list', async () => {
    const testPath = join(baseDir, 'unsorted-list', 'sort-user.ts');
    await mkdir(dirname(testPath), {recursive: true});
    await expect(writeFile(testPath, `
    import {sortUser} from "@org/utils";
    console.log(JSON.stringify(sortUser([{name: 'Michael'}, {name: 'Alice'}]), null, 2));`)).resolves.not.toThrow();

    const {stdout} = await executeProcess({
      command: 'tsx',
      args: [basename(testPath)],
      cwd: dirname(testPath),
      verbose: true,
    });

    expect(JSON.parse(stdout)).toStrictEqual([{name: 'Alice'}, {name: 'Michael'}]);
  });
});
