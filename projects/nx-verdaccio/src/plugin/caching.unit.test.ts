import { describe, expect, vi, it } from 'vitest';

import * as hasher from 'nx/src/hasher/file-hasher';
import { cacheKey } from './caching';

describe('cacheKey', () => {
  const hashObjectSpy = vi.spyOn(hasher, 'hashObject');

  it('should start with provided prefix', () => {
    expect(cacheKey('verdaccio', {} as Record<string, unknown>)).toMatch(
      /^verdaccio-/
    );
  });

  it('should use hashObject to generate hash', () => {
    expect(cacheKey('x', { prop: 42 } as Record<string, unknown>)).toMatch(
      /[0-9]*$/
    );
    expect(hashObjectSpy).toHaveBeenCalledTimes(1);
    expect(hashObjectSpy).toHaveBeenCalledWith({ prop: 42 });
  });
});
