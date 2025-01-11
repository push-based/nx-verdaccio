import { describe, expect } from 'vitest';
import { vol } from 'memfs';

import { MEMFS_VOLUME } from '@push-based/test-utils';
import { getProjectConfig } from './project-config';

describe('getProjectConfig', () => {
  it('should load data from package.json and project.json and return the merged project configuration', async () => {
    const packageJson = {
      name: '@org/my-project',
      nx: {
        targets: {
          test: {
            executor: '@nx/vite:test',
            outputs: ['{options.reportsDirectory}'],
          },
        },
      },
    };
    const projectJson = {
      name: 'my-project',
      root: 'projects/my-project',
      projectType: 'application',
      targets: {
        build: {
          executor: '@nx/vite:test',
          outputs: ['{options.reportsDirectory}'],
          options: {
            reportsDirectory: '../../coverage/testing/test-utils',
          },
        },
      },
    };
    vol.fromJSON(
      {
        'packages/lib1/project.json': JSON.stringify(projectJson),
        'packages/lib1/package.json': JSON.stringify(packageJson),
      },
      MEMFS_VOLUME
    );

    await expect(
      getProjectConfig('packages/lib1/package.json')
    ).resolves.toStrictEqual({
      ...projectJson,
      ...packageJson.nx,
      targets: {
        ...projectJson.targets,
        ...packageJson.nx.targets,
      },
    });
  });

  it('should load data from package.json and return the project configuration', async () => {
    const packageJson = {
      name: '@org/my-project',
      nx: {
        targets: {
          build: {
            executor: '@nx/vite:test',
            outputs: ['{options.reportsDirectory}'],
            options: {
              reportsDirectory: '../../coverage/testing/test-utils',
            },
          },
        },
      },
    };
    vol.fromJSON(
      {
        'packages/lib1/package.json': JSON.stringify(packageJson),
      },
      MEMFS_VOLUME
    );

    await expect(
      getProjectConfig('packages/lib1/package.json')
    ).resolves.toStrictEqual(packageJson.nx);
  });

  it('should load data from project.json and return the project configuration', async () => {
    const projectJson = {
      name: 'my-project',
      root: 'projects/my-project',
      projectType: 'application',
      targets: {
        build: {
          executor: '@nx/vite:test',
          outputs: ['{options.reportsDirectory}'],
          options: {
            reportsDirectory: '../../coverage/testing/test-utils',
          },
        },
      },
    };
    vol.fromJSON(
      {
        'packages/lib1/project.json': JSON.stringify(projectJson),
      },
      MEMFS_VOLUME
    );

    await expect(
      getProjectConfig('packages/lib1/project.json')
    ).resolves.toStrictEqual(projectJson);
  });
});
