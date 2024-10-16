import * as process from 'node:process';
import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import { describe, expect } from 'vitest';
import { executorContext, registerPluginInWorkspace } from './nx';

describe('executorContext', () => {
  it('should create context for given project name', () => {
    expect(executorContext('my-lib')).toStrictEqual({
      cwd: process.cwd(),
      isVerbose: false,
      projectName: 'my-lib',
      projectsConfigurations: {
        projects: {
          'my-lib': {
            name: 'my-lib',
            root: 'libs/my-lib',
          },
        },
        version: 1,
      },
      root: '.',
      projectGraph: {
        nodes: {
          'my-lib': {
            type: 'lib',
            name: 'my-lib',
            data: { root: 'libs/my-lib' },
          },
        },
        dependencies: {},
        externalNodes: {},
        version: '',
      },
      nxJsonConfiguration: {},
    });
  });

  it('should create context for given project options', () => {
    expect(
      executorContext({ projectName: 'other-lib', cwd: '<CWD>' })
    ).toStrictEqual({
      cwd: '<CWD>',
      isVerbose: false,
      projectName: 'other-lib',
      projectsConfigurations: {
        projects: {
          'other-lib': {
            name: 'other-lib',
            root: 'libs/other-lib',
          },
        },
        version: 1,
      },
      root: '.',
      projectGraph: {
        nodes: {
          'other-lib': {
            type: 'lib',
            name: 'other-lib',
            data: { root: 'libs/other-lib' },
          },
        },
        dependencies: {},
        externalNodes: {},
        version: '',
      },
      nxJsonConfiguration: {},
    });
  });
});

describe('registerPluginInWorkspace', () => {
  it('should register plugin name in workspace', () => {
    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    registerPluginInWorkspace(tree, 'nx-plugin');

    const nxJson = JSON.parse(tree.read('nx.json')?.toString() ?? '{}');
    expect(nxJson).toStrictEqual(
      expect.objectContaining({
        plugins: [
          {
            plugin: 'nx-plugin',
          },
        ],
      })
    );
  });

  it('should register plugin config in workspace', () => {
    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    registerPluginInWorkspace(tree, {
      plugin: 'ts-plugin',
      options: { key: 'value' },
    });

    const nxJson = JSON.parse(tree.read('nx.json')?.toString() ?? '{}');
    expect(nxJson).toStrictEqual(
      expect.objectContaining({
        plugins: [
          {
            plugin: 'ts-plugin',
            options: { key: 'value' },
          },
        ],
      })
    );
  });
});
