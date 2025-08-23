import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import { describe, expect, it } from 'vitest';
import { materializeTree } from './tree';

describe('materializeTree', () => {
  const baseDir = join('tmp', 'materialize-tree');

  it('should create files from tree', async () => {
    const root = join(baseDir, 'materialize');

    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    expect(tree.exists('nx.json')).toBe(true);

    await materializeTree(tree, root);
    const res = JSON.parse((await readFile(join(root, 'nx.json'))).toString());
    expect(res).toStrictEqual({
      affected: {
        defaultBase: 'main',
      },
      targetDefaults: {
        build: {
          cache: true,
        },
        lint: {
          cache: true,
        },
      },
    });
  });
});
