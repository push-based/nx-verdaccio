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
import { PathLike } from 'fs';

describe('caching', (): void => {
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

  // I'M PROUD OF THIS ONE, NOW IT'S TIME FOR REMAINING :)
  describe('readTargetsCache', (): void => {
    const cachePath = 'azeroth';
    let existsSyncSpy: MockInstance<[path: nodeFs.PathLike], boolean>;
    let readJsonFileSpy: MockInstance<
      [path: string, options?: JsonReadOptions],
      object
    >;

    beforeEach((): void => {
      existsSyncSpy = vi.spyOn(nodeFs, 'existsSync')
        .mockImplementation((): boolean => true);
      readJsonFileSpy = vi.spyOn(nxDevKit, 'readJsonFile')
        .mockImplementation((): Record<string, Partial<ProjectConfiguration>> => {
          return { mockKey: MOCK_PROJECT_CONFIGURATION }
      });
      process.env.NX_CACHE_PROJECT_GRAPH = 'true';
    });

    afterEach((): void => {
      existsSyncSpy.mockRestore();
      readJsonFileSpy.mockRestore();
      delete process.env.NX_CACHE_PROJECT_GRAPH;
    });

    it('should call existSync once and with correct argument', (): void => {
      readTargetsCache(cachePath);
      expect(existsSyncSpy).toHaveBeenCalledWith(cachePath);
      expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('should call readJsonFile once and with correct argument', (): void => {
      readTargetsCache(cachePath);
      expect(readJsonFileSpy).toHaveBeenCalledWith(cachePath);
      expect(readJsonFileSpy).toHaveBeenCalledTimes(1);
    });

    it('should return target cache if existsSync returns true and NX_CACHE_PROJECT_GRAPH = true', (): void => {
      const targetsCacheResult = readTargetsCache(cachePath);
      expect(targetsCacheResult).toStrictEqual({
        mockKey: MOCK_PROJECT_CONFIGURATION,
      });
    });

    it('should return empty object if NX_CACHE_PROJECT_GRAPH = false', (): void => {
      process.env.NX_CACHE_PROJECT_GRAPH = 'false';
      const targetsCacheResult = readTargetsCache(cachePath);
      expect(targetsCacheResult).toStrictEqual({});
    });

    it('should return empty object if existsSync returns false', (): void => {
      existsSyncSpy.mockImplementation((): boolean => false);
      const targetsCacheResult = readTargetsCache(cachePath);
      expect(targetsCacheResult).toStrictEqual({});
    });

    it('should return empty object if existsSync returns false and NX_CACHE_PROJECT_GRAPH = false', (): void => {
      existsSyncSpy.mockImplementation((): boolean => false);
      process.env.NX_CACHE_PROJECT_GRAPH = 'false';
      const targetsCacheResult = readTargetsCache(cachePath);
      expect(targetsCacheResult).toStrictEqual({});
    });
  });
});
