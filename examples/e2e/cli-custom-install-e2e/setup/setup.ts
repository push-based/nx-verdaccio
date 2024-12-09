import {
  DEFAULT_TEST_FIXTURE_DIST,
  executeProcess,
  getTestEnvironmentRoot,
  objectToCliArgs,
  teardownTestFolder,
} from '@push-based/test-utils';
import { join } from 'node:path';
import { copyFile, mkdir } from 'node:fs/promises';

export async function setup(
  repoPath: string,
  repoName: string,
  projectName: string
) {
  // setup nx environment for e2e tests
  await executeProcess({
    command: 'npx',
    args: objectToCliArgs({
      _: ['--yes', 'create-nx-workspace'],
      name: repoPath,
      preset: 'ts-standalone',
      ci: 'skip',
      interactive: false,
    }),
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
    join(repoPath, '.npmrc')
  );

  await executeProcess({
    command: 'npm',
    args: objectToCliArgs({
      _: ['install', '@push-based/cli'],
      save: true,
    }),
    cwd: repoPath,
  });

  const testPath = join(repoPath, 'users.json');
  await mkdir(dirname(testPath), { recursive: true });
  await writeFile(
    testPath,
    JSON.stringify([{ name: 'Michael' }, { name: 'Alice' }])
  );
  const json = JSON.parse(
    (await readFile(join(repoPath, 'project.json'))).toString()
  );
  await writeFile(
    join(repoPath, 'project.json'),
    JSON.stringify({
      ...json,
      targets: {
        ...json.targets,
        sort: {
          executor: '@push-based/cli:sort',
          options: {
            filePath: 'users.json',
          },
        },
      },
    })
  );
}
