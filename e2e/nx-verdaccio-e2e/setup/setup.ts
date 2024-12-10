import {
  DEFAULT_TEST_FIXTURE_DIST,
  executeProcess,
  getTestEnvironmentRoot,
  objectToCliArgs,
  updateJson,
} from '@push-based/test-utils';
import { dirname, join } from 'node:path';
import { copyFile, mkdir } from 'node:fs/promises';
import { logger, NxJsonConfiguration } from '@nx/devkit';
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
    (json) => ({
      ...json,
      nx: {
        ...json?.nx,
        targets: {
          ...json?.nx?.targets,
          e2e: {
            command: 'echo "e2e"',
          },
        },
      },
    })
  );

  logger.info(`Install @push-based/nx-verdaccio`);
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
      _: ['install', '@push-based/nx-verdaccio'],
      save: true,
    }),
    cwd: envRoot,
    verbose: true,
  });

  logger.info(`register nx-verdaccio plugin`);
  await updateJson<NxJsonConfiguration>(join(envRoot, 'nx.json'), (json) => ({
    ...json,
    plugins: [
      ...(json?.plugins ?? {}),
      {
        plugin: '@push-based/nx-verdaccio',
        options: {
          environments: {
            targetNames: ['e2e'],
          },
        },
      },
    ],
  }));
}
