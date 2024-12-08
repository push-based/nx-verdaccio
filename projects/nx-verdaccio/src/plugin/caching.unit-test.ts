import { afterEach, describe, expect, type MockInstance } from 'vitest';
import { cacheKey } from './caching';
import * as fileHasher from 'nx/src/hasher/file-hasher';


describe('cacheKey', (): void => {
  const prefix = 'warcraft';
  const hashData = { race: 'orc' };
  let hashObjectSpy: MockInstance<[obj: object], string>;

  describe('hashed object', (): void => {
    beforeEach((): void => {
      hashObjectSpy = vi.spyOn(fileHasher, 'hashObject');
    });
    afterEach((): void => {
      hashObjectSpy.mockRestore();
    });
    it('should return cache key with hashed object when it is empty', (): void => {
      // {} = 3244421341483603138
      expect(cacheKey(prefix, {})).toBe(`${prefix}-3244421341483603138`);
    });
    it('should return cache key with hashed object when it is NOT empty', (): void => {
      // { race: 'orc' } = 9075797468634534731
      expect(cacheKey(prefix, hashData)).toBe(`${prefix}-5048043832971198124`);
    });
    it('should call hashObject with the correct data', () => {
      const hashObjectSpy = vi.spyOn(fileHasher, 'hashObject');

      const result = cacheKey(prefix, hashData);

      expect(hashObjectSpy).toHaveBeenCalledTimes(1);
      expect(hashObjectSpy).toHaveBeenCalledWith(hashData);
      expect(result).toContain(prefix);
    });
    it('should return unmodified hashObject return value', (): void => {
      const hashObjectSpy = vi
        .spyOn(fileHasher, 'hashObject')
        .mockImplementation((): string => 'mocked-hash');
      const result = cacheKey(prefix, hashData);

      expect(result).toBe(`${prefix}-mocked-hash`);
      expect(hashObjectSpy).toHaveBeenCalledTimes(1);
      expect(hashObjectSpy).toHaveBeenCalledWith(hashData);
    });
  });
  describe('prefix', (): void => {
    it('should return cache key with unmodified prefix', (): void => {
      // {} = 3244421341483603138
      expect(cacheKey(prefix, {})).toBe(`${prefix}-3244421341483603138`);
    });
  });
  describe('format', (): void => {
    const regex = /^[a-zA-Z]+-\d+$/;
    it('should return a value in the format "string-numbers"', (): void => {
      const result = cacheKey(prefix, hashData);
      expect(result).toMatch(regex);
    });
  });
});
