import { describe, expect } from 'vitest';
import { normalizeCreateNodesOptions } from './normalize-create-nodes-options';

describe('normalizeCreateNodesOptions', () => {
  it('should provide default value for environments.environmentsDir', () => {
    expect(
      normalizeCreateNodesOptions({
        environments: {
          targetNames: ['e2e'],
        },
      })
    ).toStrictEqual(
      expect.objectContaining({
        environments: expect.objectContaining({
          environmentsDir: 'tmp/environments',
        }),
      })
    );
  });

  it('should throw error if targetNames is not provided as empty object is given', () => {
    expect(() => normalizeCreateNodesOptions({})).toThrowError(
      'Option targetNames is required in plugin options under "environments". e.g.: ["e2e"] '
    );
  });

  it('should throw error if targetNames is not provided as undefined is given', () => {
    expect(() => normalizeCreateNodesOptions()).toThrowError(
      'Option targetNames is required in plugin options under "environments". e.g.: ["e2e"] '
    );
  });
});
