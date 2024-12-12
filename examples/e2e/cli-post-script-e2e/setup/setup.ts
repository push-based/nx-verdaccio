import {
  DEFAULT_TEST_FIXTURE_DIST,
  executeProcess,
  getTestEnvironmentRoot,
  objectToCliArgs,
} from '@push-based/test-utils';
import { dirname, join } from 'node:path';
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';

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
  await executeProcess({
    command: 'npx',
    args: objectToCliArgs({
      _: ['--yes', 'create-nx-workspace'],
      name: repoName,
      preset: 'ts-standalone',
      ci: 'skip',
      interactive: false,
    }),
    verbose: true,
    cwd: dirname(envRoot),
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
      _: ['install', '@push-based/cli'],
      save: true,
    }),
    cwd: envRoot,
    verbose: true,
  });

  await cp(
    join('examples', 'e2e', 'cli-post-script-e2e', 'fixtures', 'small-data'),
    envRoot,
    { recursive: true }
  );

  const json = JSON.parse(
    (await readFile(join(envRoot, 'project.json'))).toString()
  );

  await writeFile(
    join(envRoot, 'project.json'),
    JSON.stringify({
      ...json,
      targets: {
        ...json.targets,
        sort: {
          command: 'npx cli sort --filePath=users.json',
        },
      },
    })
  );
}
