import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type MockInstance,
} from 'vitest';
import { JsonWriteOptions, type JsonReadOptions } from 'nx/src/utils/fileutils';
import {
  getCacheRecord,
  readTargetsCache,
  setCacheRecord,
  writeTargetsToCache,
} from './caching';

import * as nodeFs from 'node:fs';
import * as nxDevKit from '@nx/devkit';
import * as cachingUtils from './utils/caching.utils';

const PATH = 'azeroth';
const MOCK_CACHE_ITEM = { name: 'mocked-name' };
const MOCK_TARGET_CACHE = { ragnaros: MOCK_CACHE_ITEM };

describe('cacheRecord', (): void => {
  const prefix = 'warcraft';
  const cacheKey = 'ragnaros';

  let cacheKeySpy: MockInstance<
    [prefix: string, MOCK_CACHE_ITEM: Record<string, unknown>],
    string
  >;

  beforeEach((): void => {
    cacheKeySpy = vi.spyOn(cachingUtils, 'cacheKey').mockReturnValue(cacheKey);
  });

  afterEach((): void => {
    cacheKeySpy.mockRestore();
  });

  it('should call cacheKey once with correct arguments', (): void => {
    getCacheRecord(MOCK_TARGET_CACHE, prefix, MOCK_CACHE_ITEM);
    expect(cacheKeySpy).toHaveBeenCalledTimes(1);
    expect(cacheKeySpy).toHaveBeenCalledWith(prefix, MOCK_CACHE_ITEM);
  });

  it('should return the correct cache record if there is a cache hit', (): void => {
    expect(getCacheRecord(MOCK_TARGET_CACHE, prefix, MOCK_CACHE_ITEM)).toEqual(MOCK_CACHE_ITEM);
  });

  it('should return undefined if there is no cache hit', (): void => {
    cacheKeySpy.mockReturnValue('non-existent-key');
    expect(getCacheRecord(MOCK_TARGET_CACHE, prefix, MOCK_CACHE_ITEM)).toBeUndefined();
  });

  it('should call cacheKey once with correct arguments', (): void => {
    setCacheRecord(MOCK_TARGET_CACHE, prefix, MOCK_CACHE_ITEM, MOCK_CACHE_ITEM);
    expect(cacheKeySpy).toHaveBeenCalledTimes(1);
    expect(cacheKeySpy).toHaveBeenCalledWith(prefix, MOCK_CACHE_ITEM);
  });

  it('should set the cache record, and return it', (): void => {
    expect(setCacheRecord(MOCK_TARGET_CACHE, prefix, MOCK_CACHE_ITEM, MOCK_CACHE_ITEM)).toBe(
      MOCK_CACHE_ITEM
    );
    expect(MOCK_TARGET_CACHE).toHaveProperty(cacheKey, MOCK_CACHE_ITEM);
  });

  it('should update existing cache data, and return it', (): void => {
    const recordToUpdate = { name: 'Soul of Sylvanas' };
    setCacheRecord(MOCK_TARGET_CACHE, prefix, MOCK_CACHE_ITEM, MOCK_CACHE_ITEM);

    expect(setCacheRecord(MOCK_TARGET_CACHE, prefix, MOCK_CACHE_ITEM, recordToUpdate)).toBe(
      recordToUpdate
    );
    expect(MOCK_TARGET_CACHE).toHaveProperty(cacheKey, recordToUpdate);
  });
});

describe('readTargetsCache', (): void => {
  let existsSyncSpy: MockInstance<[PATH: nodeFs.PathLike], boolean>;
  let readJsonFileSpy: MockInstance<
    [PATH: string, options?: JsonReadOptions],
    object
  >;

  beforeEach((): void => {
    existsSyncSpy = vi
      .spyOn(nodeFs, 'existsSync')
      .mockImplementation((): boolean => true);
    readJsonFileSpy = vi
      .spyOn(nxDevKit, 'readJsonFile')
      .mockImplementation(() => {
        return MOCK_TARGET_CACHE;
      });
    vi.stubEnv('NX_CACHE_PROJECT_GRAPH', 'true');
  });

  afterEach((): void => {
    existsSyncSpy.mockRestore();
    readJsonFileSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should call existSync once with correct argument', (): void => {
    readTargetsCache(PATH);
    expect(existsSyncSpy).toHaveBeenCalledTimes(1);
    expect(existsSyncSpy).toHaveBeenCalledWith(PATH);
  });

  it('should call readJsonFile once with correct argument', (): void => {
    readTargetsCache(PATH);
    expect(readJsonFileSpy).toHaveBeenCalledTimes(1);
    expect(readJsonFileSpy).toHaveBeenCalledWith(PATH);
  });

  it('should return target cache if existsSync returns true, and NX_CACHE_PROJECT_GRAPH = true', (): void => {
    expect(readTargetsCache(PATH)).toEqual(MOCK_TARGET_CACHE);
  });

  it('should return empty object if NX_CACHE_PROJECT_GRAPH = false', (): void => {
    vi.stubEnv('NX_CACHE_PROJECT_GRAPH', 'false');
    expect(readTargetsCache(PATH)).toEqual({});
  });

  it('should return empty object if existsSync returns false', (): void => {
    existsSyncSpy.mockImplementation((): boolean => false);
    expect(readTargetsCache(PATH)).toEqual({});
  });

  it('should return empty object if existsSync returns false, and NX_CACHE_PROJECT_GRAPH = false', (): void => {
    existsSyncSpy.mockImplementation((): boolean => false);
    vi.stubEnv('NX_CACHE_PROJECT_GRAPH', 'false');
    expect(readTargetsCache(PATH)).toEqual({});
  });
});

describe('writeTargetsToCache', (): void => {
  let writeJsonFileSpy: MockInstance<
    [PATH: string, data: object, options?: JsonWriteOptions],
    void
  >;

  beforeEach((): void => {
    writeJsonFileSpy = vi
      .spyOn(nxDevKit, 'writeJsonFile')
      .mockImplementation((): string => 'preventing writing to file by mocking impl');
  });

  afterEach((): void => {
    writeJsonFileSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should call writeJsonFile once with correct arguments if process.env.NX_CACHE_PROJECT_GRAPH !== false', (): void => {
    vi.stubEnv('NX_CACHE_PROJECT_GRAPH', 'true');
    writeTargetsToCache(PATH, MOCK_TARGET_CACHE);
    expect(writeJsonFileSpy).toHaveBeenCalledTimes(1);
    expect(writeJsonFileSpy).toHaveBeenCalledWith(PATH, MOCK_TARGET_CACHE);
  });

  it('should not call writeJsonFile if process.env.NX_CACHE_PROJECT_GRAPH == false', (): void => {
    vi.stubEnv('NX_CACHE_PROJECT_GRAPH', 'false');
    writeTargetsToCache(PATH, MOCK_TARGET_CACHE);
    expect(writeJsonFileSpy).toHaveBeenCalledTimes(0);
  });
});
