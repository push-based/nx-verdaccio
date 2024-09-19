import { describe, expect, it } from 'vitest';
import { normalizeExecutorOptions } from './normalize-options';
import type { ExecutorContext } from '@nx/devkit';

describe('normalizeOptions', () => {
  it('should normalize options', () => {
    expect(
      normalizeExecutorOptions({ projectName: 'test' } as ExecutorContext, {})
    ).toStrictEqual({
      projectName: 'test',
      options: {},
    });
  });

  it('should normalize options with given environmentRoot to ', () => {
    expect(
      normalizeExecutorOptions({ projectName: 'test' } as ExecutorContext, {
        environmentRoot: 'tmp/environments/test',
      })
    ).toEqual({
      projectName: 'test',
      options: {
        environmentRoot: 'tmp/environments/test',
      },
    });
  });
});
