import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type MockInstance,
} from 'vitest';
import * as fileHasher from 'nx/src/hasher/file-hasher';
import { cacheKey } from './caching.utils';

describe('cacheKey', (): void => {
  const prefix = 'warcraft';
  const hashData = { race: 'orc' };
  const hashObjectReturnValue = '123456789';
  let hashObjectSpy: MockInstance<[obj: object], string>;

  beforeEach((): void => {
    hashObjectSpy = vi
      .spyOn(fileHasher, 'hashObject')
      .mockReturnValue(hashObjectReturnValue);
  });
  afterEach((): void => {
    hashObjectSpy.mockRestore();
  });

  describe('prefix', (): void => {
    it('should return cache key with unmodified prefix', (): void => {
      expect(cacheKey(prefix, {})).toBe(`${prefix}-${hashObjectReturnValue}`);
    });
  });

  describe('format', (): void => {
    const regex = /^[a-zA-Z]+-\d+$/;
    it('should return a value in the format "string-numbers"', (): void => {
      expect(cacheKey(prefix, hashData)).toMatch(regex);
    });
  });

  describe('hashed object', (): void => {
    it('should call hashObject once, and with correct argument', (): void => {
      cacheKey(prefix, hashData);
      expect(hashObjectSpy).toHaveBeenCalledTimes(1);
      expect(hashObjectSpy).toHaveBeenCalledWith(hashData);
    });

    it('should return cache key, when hashData is empty', (): void => {
      expect(cacheKey(prefix, {})).toBe(`${prefix}-${hashObjectReturnValue}`);
    });

    it('should return cache key, when hashData is NOT empty', (): void => {
      expect(cacheKey(prefix, hashData)).toBe(
        `${prefix}-${hashObjectReturnValue}`
      );
    });
  });
});
