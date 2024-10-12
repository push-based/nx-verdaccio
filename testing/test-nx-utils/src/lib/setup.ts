import { join } from 'node:path';

export const DEFAULT_TEST_FIXTURE_DIST = '__test_env__';

export function getTestFixturesDist(
  groupName: string,
  {
    root = 'tmp',
    fixturesDir = DEFAULT_TEST_FIXTURE_DIST,
  }: {
    root: string;
    fixturesDir?: string;
  }
): string {
  // tmp/environments/<project-name>/__test_env__/<group-name>
  return join(root, fixturesDir, groupName);
}
