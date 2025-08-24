import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@push-based/test-utils';
import { loadMergedProjectConfig } from './project-config';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

let cwdSpy;

beforeEach(() => {
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
  vol.reset();
});

afterEach(() => {
  cwdSpy.mockRestore();
});

describe('loadMergedProjectConfig', () => {
  const packageName = 'lib-a';
  const projectRoot = `packages/${packageName}`;
  const packageJson = {
    name: `@my-org/${packageName}`,
    nx: {
      targets: {
        'pkg-only': {
          command: 'echo "pkg-only"',
        },
        build: {
          executor: '@nx/webpack:webpack',
          options: {
            main: 'src/index-from-pkg.ts',
          },
        },
        test: {
          executor: '@nx/jest:jest',
          options: {
            jestConfig: 'jest.config.pkg.js',
          },
        },
      },
    },
  };

  const projectJson = {
    // In the project.json, the name is without org prefix
    name: packageName,
    root: projectRoot,
    targets: {
      'project-only': {
        command: 'echo "project-only"',
      },
      build: {
        executor: '@nx/webpack:webpack',
        options: {
          main: 'src/index-from-project.ts',
        },
      },
      test: {
        executor: '@nx/jest:jest',
        options: {
          jestConfig: 'jest.config.project.js',
        },
      },
    },
  };

  it('should load package.json nx config only', async () => {
    vol.fromJSON(
      {
        [`${projectRoot}/package.json`]: JSON.stringify(packageJson),
      },
      MEMFS_VOLUME
    );

    const expected = {
      name: packageJson.name,
      root: projectRoot,
      targets: packageJson.nx.targets,
    };

    await expect(loadMergedProjectConfig(projectRoot)).resolves.toStrictEqual(
      expected
    );
  });

  it('should load project.json only', async () => {
    vol.fromJSON(
      {
        [`${projectRoot}/project.json`]: JSON.stringify(projectJson),
      },
      MEMFS_VOLUME
    );

    await expect(loadMergedProjectConfig(projectRoot)).resolves.toStrictEqual(
      projectJson
    );
  });

  it('should merge both configs with project.json winning', async () => {
    vol.fromJSON(
      {
        [`${projectRoot}/package.json`]: JSON.stringify(packageJson),
        [`${projectRoot}/project.json`]: JSON.stringify(projectJson),
      },
      MEMFS_VOLUME
    );

    const expected = {
      ...projectJson,
      targets: {
        ...packageJson.nx.targets,
        ...projectJson.targets,
        build: {
          ...packageJson.nx.targets.build,
          ...projectJson.targets.build,
          options: {
            ...packageJson.nx.targets.build.options,
            ...projectJson.targets.build.options,
          },
        },
        test: {
          ...packageJson.nx.targets.test,
          ...projectJson.targets.test,
          options: {
            ...packageJson.nx.targets.test.options,
            ...projectJson.targets.test.options,
          },
        },
      },
    };

    await expect(loadMergedProjectConfig(projectRoot)).resolves.toStrictEqual(
      expected
    );
  });

  it('should use package name when no nx name given', async () => {
    const pkgWithoutNxName = {
      name: packageJson.name,
      nx: {
        targets: {
          build: { executor: '@nx/webpack:webpack' },
        },
      },
    };

    vol.fromJSON(
      {
        [`${projectRoot}/package.json`]: JSON.stringify(pkgWithoutNxName),
      },
      MEMFS_VOLUME
    );

    const expected = {
      name: packageJson.name,
      root: projectRoot,
      targets: pkgWithoutNxName.nx.targets,
    };

    await expect(loadMergedProjectConfig(projectRoot)).resolves.toStrictEqual(
      expected
    );
  });

  it('should return base config when no files exist', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    const expectedBaseConfig = {
      name: '',
      root: projectRoot,
    };

    await expect(loadMergedProjectConfig(projectRoot)).resolves.toStrictEqual(
      expectedBaseConfig
    );
  });

  it('should throw when no name found anywhere', async () => {
    const noNamePkg = { nx: { targets: { build: {} } } };
    const noNameProj = { root: projectRoot, targets: { build: {} } };

    vol.fromJSON(
      {
        [`${projectRoot}/package.json`]: JSON.stringify(noNamePkg),
        [`${projectRoot}/project.json`]: JSON.stringify(noNameProj),
      },
      MEMFS_VOLUME
    );

    const expectedErrorMessage = `No project name found in configuration at ${projectRoot}`;

    await expect(loadMergedProjectConfig(projectRoot)).rejects.toThrow(
      expectedErrorMessage
    );
  });
});
