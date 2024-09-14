import { describe, it, expect } from 'vitest';
import { getEnvironmentRoot, getEnvironmentsRoot } from './setup';

describe('getEnvironmentsRoot', () => {
  it('should return default env dir', () => {
    expect(getEnvironmentsRoot()).toBe('tmp/environments');
  });

  it('should return given path', () => {
    expect(getEnvironmentsRoot('env')).toBe('env');
  });
});

describe('getEnvironmentRoot', () => {
  //  projectName = process.env['NX_TASK_TARGET_PROJECT'],
  //   environmentsDir?: string
  it('should return current running tasks project name by default', () => {
    //process.env['NX_TASK_TARGET_PROJECT'] = 'cli-e2e';
    expect(getEnvironmentRoot()).toMatch(/build-env$/);
  });

  it('should accept project name', () => {
    expect(getEnvironmentRoot('cli-e2e')).toMatch(/cli-e2e$/);
  });

  it('should accept environments root', () => {
    expect(getEnvironmentRoot('cli-e2e', 'tmp/test-env')).toMatch(
      /^tmp\/test-env/
    );
  });
});
