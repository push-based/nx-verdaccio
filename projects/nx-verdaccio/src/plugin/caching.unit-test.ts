import { afterEach, beforeEach, describe, expect } from 'vitest';
import * as moduleUnderTest from './caching';
import * as cachingUtils from './utils/caching.utils';

describe('getCacheRecord', () => {
  const prefix = 'warcraft';
  const hashData = { race: 'orc' };
  let cacheKeySpy: ReturnType<typeof vi.spyOn>;
  const cacheItem = { thunderfury: 'Blessed Blade of the Windseeker' };
  const targetsCache = { 'ragnaros': cacheItem };

  beforeEach((): void => {
    cacheKeySpy = vi.spyOn(cachingUtils, 'cacheKey');

  });
  afterEach((): void => {
    cacheKeySpy.mockRestore();
  });

  it('should call cacheKey with the correct arguments', () => {

    cacheKeySpy.mockReturnValue('ragnaros');
    moduleUnderTest.getCacheRecord(targetsCache, prefix, hashData);

    expect(cacheKeySpy).toHaveBeenCalledWith(prefix, hashData);
    expect(cacheKeySpy).toHaveBeenCalledTimes(1);
  });

  it('should return the correct record if cacheKey matches', () => {
    cacheKeySpy.mockReturnValue('ragnaros');

    const result = moduleUnderTest.getCacheRecord(targetsCache, prefix, hashData);

    expect(result).toEqual(cacheItem);
  });

  it('should return undefined if no matching key exists in the cache', () => {
    cacheKeySpy.mockReturnValue('non-existent-key');

    const result = moduleUnderTest.getCacheRecord(targetsCache, prefix, hashData);

    expect(result).toBeUndefined();
  });
});


