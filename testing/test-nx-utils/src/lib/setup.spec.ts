import { describe, it, expect } from 'vitest';
import { getTestEnvironmentRoot } from './test-folder.setup';
import { join } from 'node:path';

describe('getTestEnvironmentRoot', () => {
  it('should accept project name', () => {
    expect(getTestEnvironmentRoot('cli-e2e')).toMatchPath(
      join('tmp', 'environments', 'cli-e2e')
    );
  });

  it('should accept environments root', () => {
    expect(getTestEnvironmentRoot('cli-e2e')).toMatchPath(
      join('tmp', 'environments', 'cli-e2e')
    );
  });
});
