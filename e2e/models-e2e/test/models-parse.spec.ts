import {basename, dirname, join} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {mkdir, writeFile, rm} from 'node:fs/promises';
import {executeProcess} from "@org/test-utils";

describe('models - parse user', () => {
  const workspaceRoot = join('tmp', 'npm-env', 'models-e2e');
  const baseDir = join(workspaceRoot, '__test_env__', 'parse-user');

  afterEach(async () => {
    await rm(baseDir, {recursive: true, force: true});
  });

  it('should parse valid user data', async () => {
    const testPath = join(baseDir, 'valid-user', 'parse-user.ts');
    await mkdir(dirname(testPath), {recursive: true});
    await expect(writeFile(testPath, `
    import {parseUser} from "@org/models";
    console.log(JSON.stringify(parseUser({name: 'Alice', color: 'green'}), null, 2));`)).resolves.not.toThrow();

    const {stdout} = await executeProcess({
      command: 'tsx',
      args: [basename(testPath)],
      cwd: dirname(testPath),
      verbose: true,
    });

    expect(JSON.parse(stdout)).toStrictEqual({name:"Alice"});
  });
});
