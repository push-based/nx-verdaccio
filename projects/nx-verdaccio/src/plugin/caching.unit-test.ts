import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type MockInstance,
} from 'vitest';
import * as nodeFs from 'node:fs';
import * as nxDevKit from '@nx/devkit';
import { type ProjectConfiguration } from '@nx/devkit';
import { type JsonReadOptions } from 'nx/src/utils/fileutils';
import {
  getCacheRecord,
  readTargetsCache,
  setCacheRecord,
  writeTargetsToCache,
} from './caching';
import * as cachingUtils from './utils/caching.utils';
import { MOCK_TARGETS_CACHE } from '../fixtures/project-configuration.fixture';

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

  it('should call cacheKey once with correct arguments', (): void => {
    getCacheRecord(targetsCache, prefix, hashData);
    expect(cacheKeySpy).toHaveBeenCalledTimes(1);
    expect(cacheKeySpy).toHaveBeenCalledWith(prefix, hashData);
  });

  it('should return the correct cache record if there is a cache hit', (): void => {
    expect(getCacheRecord(targetsCache, prefix, hashData)).toEqual(cacheItem);
  });

  it('should return undefined if there is no cache hit', (): void => {
    cacheKeySpy.mockReturnValue('non-existent-key');
    expect(getCacheRecord(targetsCache, prefix, hashData)).toBeUndefined();
  });

  it('should call cacheKey once with correct arguments', (): void => {
    setCacheRecord(targetsCache, prefix, hashData, cacheItem);
    expect(cacheKeySpy).toHaveBeenCalledTimes(1);
    expect(cacheKeySpy).toHaveBeenCalledWith(prefix, hashData);
  });

  it('should set the cache record, and return it', (): void => {
    expect(setCacheRecord(targetsCache, prefix, hashData, cacheItem)).toBe(
      cacheItem
    );
    expect(targetsCache).toHaveProperty(cacheKey, cacheItem);
  });

  it('should update existing cache data, and return it', (): void => {
    const recordToUpdate = { thunderfury: 'Soul of Sylvanas' };
    setCacheRecord(targetsCache, prefix, hashData, cacheItem);

    expect(setCacheRecord(targetsCache, prefix, hashData, recordToUpdate)).toBe(
      recordToUpdate
    );
    expect(targetsCache).toHaveProperty(cacheKey, recordToUpdate);
  });
});

describe('readTargetsCache', (): void => {
  const path = 'azeroth';
  let existsSyncSpy: MockInstance<[path: nodeFs.PathLike], boolean>;
  let readJsonFileSpy: MockInstance<
    [path: string, options?: JsonReadOptions],
    object
  >;

  beforeEach((): void => {
    existsSyncSpy = vi
      .spyOn(nodeFs, 'existsSync')
      .mockImplementation((): boolean => true);
    readJsonFileSpy = vi
      .spyOn(nxDevKit, 'readJsonFile')
      .mockImplementation((): Record<string, Partial<ProjectConfiguration>> => {
        return MOCK_TARGETS_CACHE;
      });
    vi.stubEnv('NX_CACHE_PROJECT_GRAPH', 'true');
  });

  afterEach((): void => {
    existsSyncSpy.mockRestore();
    readJsonFileSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should call existSync once with correct argument', (): void => {
    readTargetsCache(path);
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    expect(existsSyncSpy).toHaveBeenCalledWith(path);
  });

  it('should call readJsonFile once with correct argument', (): void => {
    readTargetsCache(path);
    expect(readJsonFileSpy).toHaveBeenCalledTimes(1);
    expect(readJsonFileSpy).toHaveBeenCalledWith(path);
  });

  it('should return target cache if existsSync returns true, and NX_CACHE_PROJECT_GRAPH = true', (): void => {
    expect(readTargetsCache(path)).toEqual(MOCK_TARGETS_CACHE);
  });

  it('should return empty object if NX_CACHE_PROJECT_GRAPH = false', (): void => {
    process.env.NX_CACHE_PROJECT_GRAPH = 'false';
    expect(readTargetsCache(path)).toEqual({});
  });

  it('should return empty object if existsSync returns false', (): void => {
    existsSyncSpy.mockImplementation((): boolean => false);
    expect(readTargetsCache(path)).toEqual({});
  });

  it('should return empty object if existsSync returns false, and NX_CACHE_PROJECT_GRAPH = false', (): void => {
    existsSyncSpy.mockImplementation((): boolean => false);
    process.env.NX_CACHE_PROJECT_GRAPH = 'false';
    expect(readTargetsCache(path)).toEqual({});
  });
});

describe('writeTargetsToCache', (): void => {
  const writeJsonFile = vi
    .spyOn(nxDevKit, 'writeJsonFile')
    .mockImplementation((): string => 'dont write to file :D');
  const path = 'azeroth';

  afterEach((): void => {
    writeJsonFile.mockRestore();
    delete process.env.NX_CACHE_PROJECT_GRAPH;
  });

  it('should call writeJsonFile once with correct arguments if process.env.NX_CACHE_PROJECT_GRAPH !== false', (): void => {
    process.env.NX_CACHE_PROJECT_GRAPH = 'true';
    writeTargetsToCache(path, MOCK_TARGETS_CACHE);
    expect(writeJsonFile).toHaveBeenCalledTimes(1);
    expect(writeJsonFile).toHaveBeenCalledWith(path, MOCK_TARGETS_CACHE);
  });

  it('should not call writeJsonFile if process.env.NX_CACHE_PROJECT_GRAPH == false', (): void => {
    process.env.NX_CACHE_PROJECT_GRAPH = 'false';
    writeTargetsToCache(path, MOCK_TARGETS_CACHE);
    expect(writeJsonFile).toHaveBeenCalledTimes(0);
  });
});
