import { afterEach, beforeEach, describe, expect } from 'vitest';
import * as moduleUnderTest from './caching';
import * as cachingUtils from './utils/caching.utils';
import * as nodeFs  from 'node:fs';
import { readTargetsCache, setCacheRecord } from './caching';
import { cacheKey } from './utils/caching.utils';

describe('caching', () => {
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

  describe('getCacheRecord', () => {
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

  describe('setCacheRecord', (): void => {
    const cacheData = { thunderfury: 'Blood of Sylvanas' };
    it('should call cacheKey with the correct arguments', (): void => {
      cacheKeySpy.mockReturnValue('ragnaros');
      setCacheRecord(targetsCache, prefix, hashData, cacheData);

      expect(cacheKeySpy).toHaveBeenCalledWith(prefix, hashData);
      expect(cacheKeySpy).toHaveBeenCalledTimes(1);
    });

    it('should set a cache record and return the cached data', () => {
      const result = setCacheRecord(targetsCache, prefix, hashData, cacheData);

      const expectedKey = cacheKey(prefix, hashData);
      expect(targetsCache).toHaveProperty(expectedKey, cacheData);
      expect(result).toBe(cacheData);
    });

    it('should overwrite existing cache data with the same key', () => {
      const updated = { thunderfury: 'Soul of Sylvanas' };

      cacheKeySpy.mockReturnValue('ragnaros');

      setCacheRecord(targetsCache, prefix, hashData, cacheData);
      const result = setCacheRecord(targetsCache, prefix, hashData, updated);

      const expectedKey = cacheKey(prefix, hashData);
      expect(targetsCache).toHaveProperty(expectedKey, updated);
      expect(result).toBe(updated);
    });
  });

  //export function readTargetsCache(
  //   cachePath: string
  // ): Record<string, Partial<ProjectConfiguration>> {
  //   return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && existsSync(cachePath)
  //     ? readJsonFile(cachePath)
  //     : {};
  // }
  describe('readTargetsCache', (): void => {
    const existsSyncSpy = vi
      .spyOn(nodeFs, 'existsSync')
      .mockImplementation((): boolean => true);

    // beforeEach((): void => {
    //   existsSyncSpy = vi.spyOn(cachingUtils, 'cacheKey');
    // });

    afterEach((): void => {
      existsSyncSpy.mockRestore();
    });

    it('should call cacheKey with the correct arguments', (): void => {
      readTargetsCache('test');

      expect(existsSyncSpy).toHaveBeenCalledWith('test');
      expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    });
  });
})
