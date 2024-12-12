import { afterEach, beforeEach, describe, expect, MockInstance } from 'vitest';
import * as moduleUnderTest from './caching';
import * as cachingUtils from './utils/caching.utils';
import * as nodeFs from 'node:fs';
import * as nxDevKit from '@nx/devkit';
import { readTargetsCache, setCacheRecord } from './caching';
import { cacheKey } from './utils/caching.utils';
import { ProjectConfiguration } from '@nx/devkit';
import { JsonReadOptions } from 'nx/src/utils/fileutils';
import { MOCK_PROJECT_CONFIGURATION } from './constants.unit-test';

describe('caching', () => {
  const prefix = 'warcraft';
  const hashData = { race: 'orc' };
  let cacheKeySpy: ReturnType<typeof vi.spyOn>;
  const cacheItem = { thunderfury: 'Blessed Blade of the Windseeker' };
  const targetsCache = { ragnaros: cacheItem };

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

      const result = moduleUnderTest.getCacheRecord(
        targetsCache,
        prefix,
        hashData
      );

      expect(result).toEqual(cacheItem);
    });

    it('should return undefined if no matching key exists in the cache', () => {
      cacheKeySpy.mockReturnValue('non-existent-key');

      const result = moduleUnderTest.getCacheRecord(
        targetsCache,
        prefix,
        hashData
      );

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

  describe('readTargetsCache', (): void => {
    let existsSyncSpy: MockInstance<[path: nodeFs.PathLike], boolean>;
    let readJsonFileSpy: MockInstance<
      [path: string, options?: JsonReadOptions],
      object
    >;

    beforeEach((): void => {
      existsSyncSpy = vi.spyOn(nodeFs, 'existsSync');
      readJsonFileSpy = vi.spyOn(nxDevKit, 'readJsonFile');
      process.env.NX_CACHE_PROJECT_GRAPH = 'true';
    });

    afterEach((): void => {
      existsSyncSpy.mockRestore();
      readJsonFileSpy.mockRestore();
      delete process.env.NX_CACHE_PROJECT_GRAPH;
    });

    it('should call exist sync with the correct arguments', (): void => {
      existsSyncSpy.mockImplementation((): boolean => true);
      readJsonFileSpy.mockImplementation((): Record<string, Partial<ProjectConfiguration>> =>  {
        return {'mockKey': MOCK_PROJECT_CONFIGURATION}
      });
      process.env.NX_CACHE_PROJECT_GRAPH = 'true';
      readTargetsCache('test');
      expect(existsSyncSpy).toHaveBeenCalledWith('test');
      expect(existsSyncSpy).toHaveBeenCalledTimes(1);
      expect(readJsonFileSpy).toHaveBeenCalledTimes(1);
    });

    it('should return target cache from json file', (): void => {
      existsSyncSpy.mockImplementation((): boolean => true);
      readJsonFileSpy.mockImplementation((): Record<string, Partial<ProjectConfiguration>> =>  {
        return {'mockKey': MOCK_PROJECT_CONFIGURATION}
      });
      process.env.NX_CACHE_PROJECT_GRAPH = 'true';
      const targetsCacheResult = readTargetsCache('test');
      expect(targetsCacheResult).toStrictEqual({
        mockKey: MOCK_PROJECT_CONFIGURATION,
      });
    });

    it('should return empty object if NX_CACHE_PROJECT_GRAPH = false', (): void => {
      existsSyncSpy.mockImplementation((): boolean => true);
      process.env.NX_CACHE_PROJECT_GRAPH = 'false';
      const targetsCacheResult = readTargetsCache('test');
      expect(targetsCacheResult).toStrictEqual({});
    });

    it('should return empty object if existsSync returns false', (): void => {
      existsSyncSpy.mockImplementation((): boolean => true);
      process.env.NX_CACHE_PROJECT_GRAPH = 'false';
      const targetsCacheResult = readTargetsCache('test');
      expect(targetsCacheResult).toStrictEqual({});
    });

    it('should return empty object if existsSync returns false and NX_CACHE_PROJECT_GRAPH = false', (): void => {
      existsSyncSpy.mockImplementation((): boolean => false);
      process.env.NX_CACHE_PROJECT_GRAPH = 'false';
      const targetsCacheResult = readTargetsCache('test');
      expect(targetsCacheResult).toStrictEqual({});
    });
  });
});
