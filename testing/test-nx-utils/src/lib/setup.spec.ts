import { describe, it, expect } from 'vitest';
import { getTestEnvironmentRoot } from './test-folder.setup';

describe('getTestEnvironmentRoot', () => {
  it('should accept project name', () => {
    expect(getTestEnvironmentRoot('cli-e2e')).toMatch(/cli-e2e$/);
  });

  it('should accept environments root', () => {
    expect(getTestEnvironmentRoot('cli-e2e')).toMatch(
      /^tmp\/environments\/cli-e2e/
    );
  });
});
