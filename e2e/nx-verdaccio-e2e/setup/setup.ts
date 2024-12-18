import {
  DEFAULT_TEST_FIXTURE_DIST,
  executeProcess,
  getTestEnvironmentRoot,
  objectToCliArgs,
  updateJson,
} from '@push-based/test-utils';
import { copyFile, lstat, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { dirname, join } from 'node:path';
import { copyFile, mkdir, symlink, readlink } from 'node:fs/promises';
import {
  logger,
  NxJsonConfiguration,
  PluginConfiguration,
  TargetConfiguration,
} from '@nx/devkit';
import { PackageJson } from 'nx/src/utils/package-json';

export async function setup({
  envRoot,
  projectName,
  repoName,
}: {
  envRoot: string;
  repoName: string;
  projectName: string;
}) {
  // dedupe packages because symlink copy problems
  await mkdir(envRoot, { recursive: true });
  // setup nx environment for e2e tests
  logger.info(`Created nx workspace under ${envRoot}`);
  await executeProcess({
    command: 'npx',
    args: objectToCliArgs({
      _: ['--yes', '--quiet', 'create-nx-workspace'],
      name: repoName,
      preset: 'ts',
      ci: 'skip',
      e2eTestRunner: 'none',
      interactive: false,
    }),
    verbose: true,
    cwd: dirname(envRoot),
  });

  logger.info(`Add project & target`);
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['generate', '@nx/js:library', 'pkg'],
      directory: 'packages/pkg',
      bundler: 'tsc',
      unitTestRunner: 'none',
      linter: 'none',
      interactive: false,
    }),
    verbose: true,
    cwd: envRoot,
  });
  await updateJson<PackageJson>(
    join(envRoot, 'packages', 'pkg', 'package.json'),
    (json) => ({
      ...json,
      nx: {
        ...json?.nx,
        targets: {
          ...json?.nx?.targets,
          build: {
            options: {
              outputPath: ['dist/pkg'],
            },
            command: 'echo "lib"',
          },
        },
      },
    })
  );

  logger.info(`Add e2e project & target`);
  await executeProcess({
    command: 'nx',
    args: objectToCliArgs({
      _: ['generate', '@nx/js:library', 'pkg-e2e'],
      directory: 'packages/pkg-e2e',
      bundler: 'tsc',
      unitTestRunner: 'none',
      linter: 'none',
      interactive: false,
    }),
    verbose: true,
    cwd: envRoot,
  });
  await updateJson<PackageJson>(
    join(envRoot, 'packages', 'pkg-e2e', 'package.json'),
    (json) =>
      updatePackageJsonNxTargets(json, {
        ...json?.nx?.targets,
        e2e: {
          command: 'echo "e2e"',
        },
      })
  );

  logger.info(`Install @push-based/nx-verdaccio`);
  await executeProcess({
    command: 'npm',
    args: objectToCliArgs({
      _: ['install', '@push-based/nx-verdaccio'],
      save: true,
    }),
    cwd: envRoot,
    verbose: true,
  });
  await mkdir(
    join(
      getTestEnvironmentRoot(projectName),
      DEFAULT_TEST_FIXTURE_DIST,
      repoName
    ),
    { recursive: true }
  );
  await copyFile(
    join(getTestEnvironmentRoot(projectName), '.npmrc'),
    join(envRoot, '.npmrc')
  );

  await executeProcess({
    command: 'npm',
    args: objectToCliArgs({
      _: ['dedupe'],
    }),
    verbose: true,
    cwd: dirname(envRoot),
  });
}

export async function registerNxVerdaccioPlugin(
  envRoot: string,
  options?: PluginConfiguration
) {
  logger.info(`register nx-verdaccio plugin`);
  await updateJson<NxJsonConfiguration>(join(envRoot, 'nx.json'), (json) =>
    registerPluginInNxJson(json, {
      plugin: '@push-based/nx-verdaccio',
      options: {
        environments: {
          targetNames: ['e2e'],
        },
      },
      ...options,
    })
  );
}

export function registerPluginInNxJson(
  nxJson: NxJsonConfiguration,
  pluginConfig: PluginConfiguration
) {
  return {
    ...nxJson,
    plugins: [...(nxJson?.plugins ?? []), pluginConfig],
  };
}

function updatePackageJsonNxTargets(
  pkgJson: PackageJson,
  targets: Record<string, TargetConfiguration>
) {
  return {
    ...pkgJson,
    nx: {
      ...pkgJson?.nx,
      targets: {
        ...pkgJson?.nx?.targets,
        ...targets,
      },
    },
  };
}

/**
 * This function avoids issues with symlinks and other edge cases.
 *
 */
export async function copyDirectory(
  src: string,
  dest: string,
  exclude: string[] = []
) {
  // Ensure the destination directory exists
  await mkdir(dest, { recursive: true });

  // Read the contents of the source directory
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    // Skip excluded directories or files
    if (exclude.includes(entry.name)) continue;

    const stats = await lstat(srcPath);

    if (stats.isSymbolicLink()) {
      // Handle symbolic links if necessary (copy the link itself or resolve it)
      const linkTarget = await readlink(srcPath);
      await symlink(linkTarget, destPath);
    } else if (stats.isDirectory()) {
      // Recursively copy directories
      await copyDirectory(srcPath, destPath, exclude);
    } else if (stats.isFile()) {
      // Copy files
      await copyFile(srcPath, destPath);
    }
  }
}
