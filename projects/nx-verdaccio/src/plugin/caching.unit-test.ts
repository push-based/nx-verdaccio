import { afterEach, beforeEach, describe, expect, type MockInstance } from 'vitest';
import * as nodeFs from 'node:fs';
import * as nxDevKit from '@nx/devkit';
import { type ProjectConfiguration } from '@nx/devkit';
import { type JsonReadOptions } from 'nx/src/utils/fileutils';
import { getCacheRecord, readTargetsCache, setCacheRecord } from './caching';
import * as cachingUtils from './utils/caching.utils';
import { MOCK_PROJECT_CONFIGURATION } from './constants.unit-test';

describe('caching', (): void => {
  describe('cacheRecord', (): void => {
    let cacheKeySpy: MockInstance<
      [prefix: string, hashData: Record<string, unknown>],
      string
    >;

    const prefix = 'warcraft';
    const cacheKey = 'ragnaros';
    const hashData = { race: 'orc' };
    const cacheItem = { thunderfury: 'Blessed Blade of the Windseeker' };
    const targetsCache = { ragnaros: cacheItem };

    beforeEach((): void => {
      cacheKeySpy = vi.spyOn(cachingUtils, 'cacheKey').mockReturnValue(cacheKey);
    });
    afterEach((): void => {
      cacheKeySpy.mockRestore();
    });

    describe('getCacheRecord', (): void => {
      it('should call cacheKey once and, with correct arguments', (): void => {
        getCacheRecord(targetsCache, prefix, hashData);

        expect(cacheKeySpy).toHaveBeenCalledTimes(1);
        expect(cacheKeySpy).toHaveBeenCalledWith(prefix, hashData);
      });

      it('should return correct record if match', (): void => {
        const result = getCacheRecord(
          targetsCache,
          prefix,
          hashData
        );
        expect(result).toEqual(cacheItem);
      });

      it('should return undefined if no match', (): void => {
        cacheKeySpy.mockReturnValue('non-existent-key');

        const result = getCacheRecord(
          targetsCache,
          prefix,
          hashData
        );
        expect(result).toBeUndefined();
      });
    });

    describe('setCacheRecord', (): void => {
      const cacheData = { thunderfury: 'Blood of Sylvanas' };

      it('should call cacheKey once, and with correct arguments', (): void => {
        setCacheRecord(targetsCache, prefix, hashData, cacheData);

        expect(cacheKeySpy).toHaveBeenCalledTimes(1);
        expect(cacheKeySpy).toHaveBeenCalledWith(prefix, hashData);
      });

      it('should set the cache record, and return it', (): void => {
        const result = setCacheRecord(targetsCache, prefix, hashData, cacheData);

        expect(result).toBe(cacheData);
        expect(targetsCache).toHaveProperty(cacheKey, cacheData);
      });

      it('should update existing cache data, and return it', (): void => {
        const recordToUpdate = { thunderfury: 'Soul of Sylvanas' };

        setCacheRecord(targetsCache, prefix, hashData, cacheData);
        const updatedRecord = setCacheRecord(targetsCache, prefix, hashData, recordToUpdate);

        expect(updatedRecord).toBe(recordToUpdate);
        expect(targetsCache).toHaveProperty(cacheKey, recordToUpdate);
      });
    });
  })

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

    it('should call existSync once, and with correct argument', (): void => {
      readTargetsCache(cachePath);
      expect(existsSyncSpy).toHaveBeenCalledWith(cachePath);
      expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('should call readJsonFile once, and with correct argument', (): void => {
      readTargetsCache(cachePath);
      expect(readJsonFileSpy).toHaveBeenCalledWith(cachePath);
      expect(readJsonFileSpy).toHaveBeenCalledTimes(1);
    });

    it('should return target cache if existsSync returns true, and NX_CACHE_PROJECT_GRAPH = true', (): void => {
      const targetsCacheResult = readTargetsCache(cachePath);
      expect(targetsCacheResult).toEqual({
        mockKey: MOCK_PROJECT_CONFIGURATION,
      });
    });

    it('should return empty object if NX_CACHE_PROJECT_GRAPH = false', (): void => {
      process.env.NX_CACHE_PROJECT_GRAPH = 'false';
      const targetsCacheResult = readTargetsCache(cachePath);
      expect(targetsCacheResult).toEqual({});
    });

    it('should return empty object if existsSync returns false', (): void => {
      existsSyncSpy.mockImplementation((): boolean => false);
      const targetsCacheResult = readTargetsCache(cachePath);
      expect(targetsCacheResult).toEqual({});
    });

    it('should return empty object if existsSync returns false, and NX_CACHE_PROJECT_GRAPH = false', (): void => {
      existsSyncSpy.mockImplementation((): boolean => false);
      process.env.NX_CACHE_PROJECT_GRAPH = 'false';
      const targetsCacheResult = readTargetsCache(cachePath);
      expect(targetsCacheResult).toEqual({});
    });
  });
});
