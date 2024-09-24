import { describe, it, expect } from 'vitest';
import { getTestEnvironmentRoot } from './test-folder.setup';

describe('getTestEnvironmentRoot', () => {
  //  projectName = process.env['NX_TASK_TARGET_PROJECT'],
  //   environmentsDir?: string
  it('should return current running tasks project name by default', () => {
    //process.env['NX_TASK_TARGET_PROJECT'] = 'cli-e2e';
    expect(getTestEnvironmentRoot()).toMatch(/build-env$/);
  });

  it('should accept project name', () => {
    expect(getTestEnvironmentRoot('cli-e2e')).toMatch(/cli-e2e$/);
  });

  it('should accept environments root', () => {
    expect(getTestEnvironmentRoot('cli-e2e', 'tmp/test-env')).toMatch(
      /^tmp\/test-env/
    );
  });
});
